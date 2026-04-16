import type { DesignAnalysis } from "../types.js";

export type ProviderName = "google" | "anthropic";

export interface DesignAnalyzer {
  readonly provider: ProviderName;
  readonly model: string;
  analyze(screenshotPath: string): Promise<DesignAnalysis>;
}

export interface ResolveOptions {
  model?: string;
  provider?: ProviderName;
  env: NodeJS.ProcessEnv;
}

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  google: "gemini-2.5-flash",
  anthropic: "claude-opus-4-7",
};
