import type { TokenizerDescriptor } from "./types";

export const TOKENIZER_DESCRIPTORS: TokenizerDescriptor[] = [
  {
    id: "gpt",
    label: "GPT",
    family: "OpenAI",
    load: () => import("./openai").then((m) => m.loadOpenAITokenizer()),
  },
  {
    id: "llama",
    label: "Llama",
    family: "Meta",
    load: () => import("./llama").then((m) => m.loadLlamaTokenizer()),
  },
  {
    id: "mistral",
    label: "Mistral",
    family: "Mistral AI",
    load: () => import("./mistral").then((m) => m.loadMistralTokenizer()),
  },
];

export const DEFAULT_TOKENIZER_ID = "gpt";

export function getTokenizerDescriptor(id: string): TokenizerDescriptor | undefined {
  return TOKENIZER_DESCRIPTORS.find((t) => t.id === id);
}

export const EXAMPLES: { label: string; text: string }[] = [
  { label: "English", text: "The quick brown fox jumps over the lazy dog." },
  { label: "Hindi", text: "कृत्रिम बुद्धिमत्ता सुरक्षा महत्वपूर्ण है।" },
  { label: "Punjabi", text: "ਕ੍ਰਿਤ੍ਰਿਮ ਬੁੱਧੀ ਸੁਰੱਖਿਆ ਮਹੱਤਵਪੂਰਨ ਹੈ।" },
  { label: "Emoji", text: "AI security 🔐🤖🚀🔥" },
  { label: "Numbers", text: "1234567890 3.14159 2026" },
  { label: "URL", text: "https://example.com/api/v1/users?id=123" },
  { label: "Special Characters", text: "@#$%^&*()_+=[]{}<>?/\\" },
  { label: "Typos", text: "Thisss caaat is sittinnnggg onnn theee tableeee 😂" },
];

export const MAX_INPUT_LENGTH = 5000;
