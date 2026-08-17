declare module "mistral-tokenizer-js" {
  interface MistralTokenizer {
    encode(prompt: string, addBosToken?: boolean, addPrecedingSpace?: boolean, logPerformance?: boolean): number[];
    decode(tokenIds: number[], addBosToken?: boolean, addPrecedingSpace?: boolean): string;
  }
  const mistralTokenizer: MistralTokenizer;
  export default mistralTokenizer;
}
