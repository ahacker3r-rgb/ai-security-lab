export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

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
