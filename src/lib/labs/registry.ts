import type { LabDefinition } from "./types";
import { directInjection } from "./content/direct-injection";
import { systemDisclosure } from "./content/system-disclosure";
import { instructionData } from "./content/instruction-data";
import { indirectInjection } from "./content/indirect-injection";
import { ragInjection } from "./content/rag-injection";
import { multiTurn } from "./content/multi-turn";
import { toolInjection } from "./content/tool-injection";
import { chainedAttack } from "./content/chained-attack";

export const LAB_DEFINITIONS: LabDefinition[] = [
  directInjection,
  systemDisclosure,
  instructionData,
  indirectInjection,
  ragInjection,
  multiTurn,
  toolInjection,
  chainedAttack,
];

const bySlug = new Map(LAB_DEFINITIONS.map((lab) => [lab.slug, lab]));

export function getLabDefinition(slug: string): LabDefinition | undefined {
  return bySlug.get(slug);
}
