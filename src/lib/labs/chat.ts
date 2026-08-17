import "server-only";
import type { LabDefinition, TranscriptMessage } from "./types";
import type { ToolCallRecord } from "./tools";
import { executeTool } from "./tools";
import { generateResponse, type ChatMessage } from "@/lib/llm";
import { runValidator } from "./validators";

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONVERSATION_MESSAGES = 40; // user+assistant turns combined
const TOOL_CALL_FENCED_PATTERN = /```tool_call\s*([\s\S]*?)```/;
// Fallback for models that reliably produce the right JSON shape but don't
// consistently wrap it in the requested code fence — matches a bare
// {"name": ..., "args": {...}} object anywhere in the reply.
const TOOL_CALL_BARE_PATTERN = /\{[\s\S]*?"name"\s*:\s*"[^"]+"[\s\S]*?"args"\s*:\s*\{[\s\S]*?\}[\s\S]*?\}/;

function buildSystemMessage(lab: LabDefinition): string {
  const items = lab.buildContext?.() ?? [];
  if (items.length === 0) return lab.systemPrompt;

  const tag = lab.contextWrapperTag ?? "context";
  const inner = items
    .map((item) => `<entry source="${item.source}">\n${item.content}\n</entry>`)
    .join("\n\n");

  return `${lab.systemPrompt}\n\n<${tag}>\n${inner}\n</${tag}>`;
}

function toLLMMessages(systemContent: string, history: TranscriptMessage[]): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: "system", content: systemContent }];
  for (const m of history) {
    if (m.role === "tool") {
      // Surface only the tool's result to the model as a system-level
      // observation — the stored record also carries args/unauthorized
      // metadata for the validator, which the model doesn't need to see.
      let resultOnly: unknown = m.content;
      try {
        resultOnly = JSON.parse(m.content).result;
      } catch {
        // fall back to raw content
      }
      messages.push({ role: "system", content: `[Tool result for ${m.toolName}]: ${JSON.stringify(resultOnly)}` });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }
  return messages;
}

function tryParseToolCall(jsonText: string): { name: string; args: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(jsonText.trim());
    if (typeof parsed?.name === "string") {
      return { name: parsed.name, args: parsed.args && typeof parsed.args === "object" ? parsed.args : {} };
    }
  } catch {
    // Malformed JSON — treat as no tool call.
  }
  return null;
}

function extractToolCall(text: string): { name: string; args: Record<string, unknown> } | null {
  const fenced = text.match(TOOL_CALL_FENCED_PATTERN);
  if (fenced) return tryParseToolCall(fenced[1]);

  const bare = text.match(TOOL_CALL_BARE_PATTERN);
  if (bare) return tryParseToolCall(bare[0]);

  return null;
}

export interface RunTurnResult {
  history: TranscriptMessage[];
  toolCalls: ToolCallRecord[];
  completed: boolean;
  assistantReply: string;
}

/**
 * Runs one user turn: sends the conversation to the model, executes at
 * most one simulated tool call if the model requests one, then checks the
 * lab's deterministic validator against the full transcript.
 */
export async function runLabTurn(
  lab: LabDefinition,
  priorHistory: TranscriptMessage[],
  userMessage: string
): Promise<RunTurnResult> {
  const systemContent = buildSystemMessage(lab);
  const now = () => new Date().toISOString();

  const history: TranscriptMessage[] = [
    ...priorHistory,
    { role: "user", content: userMessage, createdAt: now() },
  ];

  const first = await generateResponse(toLLMMessages(systemContent, history));
  let assistantText = first.text;
  const toolCalls: ToolCallRecord[] = [];

  if (lab.tools && lab.tools.length > 0) {
    const requested = extractToolCall(assistantText);
    if (requested) {
      const record = executeTool(requested.name, requested.args);
      toolCalls.push(record);

      history.push({ role: "assistant", content: assistantText, createdAt: now() });
      history.push({
        role: "tool",
        toolName: record.name,
        content: JSON.stringify({ args: record.args, result: record.result, unauthorized: record.unauthorized }),
        createdAt: now(),
      });

      const followUp = await generateResponse(toLLMMessages(systemContent, history));
      assistantText = followUp.text;
    }
  }

  history.push({ role: "assistant", content: assistantText, createdAt: now() });

  const completed = runValidator(lab.validatorId, { messages: history, toolCalls: extractAllToolCalls(history) });

  return { history, toolCalls, completed, assistantReply: assistantText };
}

/** Recovers the full tool-call log (including from prior turns) from a transcript's tool messages. */
export function extractAllToolCalls(history: TranscriptMessage[]): ToolCallRecord[] {
  const calls: ToolCallRecord[] = [];
  for (const m of history) {
    if (m.role !== "tool" || !m.toolName) continue;
    try {
      const stored = JSON.parse(m.content) as { args: Record<string, unknown>; result: unknown; unauthorized: boolean };
      calls.push({ name: m.toolName, args: stored.args ?? {}, result: stored.result, unauthorized: !!stored.unauthorized });
    } catch {
      // ignore malformed stored tool entries
    }
  }
  return calls;
}
