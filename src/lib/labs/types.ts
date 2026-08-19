export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

/** Marker toolName used to record "student uploaded this file" in a transcript - not a real tool call. Shared between server (chat.ts) and client (lab-chat.tsx). */
export const UPLOAD_MARKER_TOOL_NAME = "document_upload";

export interface LabHint {
  level: 1 | 2 | 3;
  text: string;
}

export interface AttackReplayStep {
  label: string;
  description: string;
  trust: "trusted" | "untrusted" | "model" | "tool" | "boundary";
}

export interface ContextItem {
  source: string;
  trusted: boolean;
  content: string;
  /** When set alongside downloadPassword, the UI shows a locked-file download card instead of the content inline. */
  filename?: string;
  downloadPassword?: string;
}

export interface SimulatedTool {
  name: string;
  description: string;
  sensitive: boolean;
}

export interface LabDefinition {
  slug: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
  objective: string;
  estimatedTime: string;
  systemPrompt: string;
  buildContext?: () => ContextItem[];
  /** XML-ish tag name used to wrap injected context items in the system message (default: "context"). */
  contextWrapperTag?: string;
  /**
   * When true, buildContext()'s items are shown to the student (e.g. as a
   * locked download) but are NOT auto-injected into the model's context.
   * The student must upload a file via the chat's upload control first -
   * only then does its content enter the model's system message. Without
   * this, a student can solve a "download the document" lab by just asking
   * the assistant to summarize "the document" without ever fetching it.
   */
  contextRequiresUpload?: boolean;
  tools?: SimulatedTool[];
  hints: [LabHint, LabHint, LabHint];
  explanation: {
    whatHappened: string;
    whyItHappened: string;
    securityImpact: string;
    defenses: string[];
  };
  attackReplay: AttackReplayStep[];
  validatorId: string;
}

export interface TranscriptMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  createdAt: string;
}
