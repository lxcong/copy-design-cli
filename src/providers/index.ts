import type {
  DesignAnalyzer,
  ProviderName,
  ResolveOptions,
} from "./types.js";
import { DEFAULT_MODELS } from "./types.js";
import { createGeminiAnalyzer } from "./gemini.js";
import { createAnthropicAnalyzer } from "./anthropic.js";

const MODEL_PREFIXES: Record<string, ProviderName> = {
  "claude-": "anthropic",
  "gemini-": "google",
};

const KEY_ENV_VAR: Record<ProviderName, string> = {
  google: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

function inferProviderFromModel(model: string): ProviderName {
  for (const [prefix, provider] of Object.entries(MODEL_PREFIXES)) {
    if (model.startsWith(prefix)) return provider;
  }
  throw new Error(
    `Unrecognized model '${model}'. Expected a model starting with 'claude-' or 'gemini-', or pass --provider explicitly.`,
  );
}

export function resolveProvider(opts: ResolveOptions): DesignAnalyzer {
  const { model, provider, env } = opts;

  let chosenProvider: ProviderName;
  let chosenModel: string;

  if (model) {
    const inferred = inferProviderFromModel(model);
    if (provider && provider !== inferred) {
      throw new Error(
        `--model '${model}' implies provider '${inferred}', but --provider '${provider}' was passed.`,
      );
    }
    chosenProvider = inferred;
    chosenModel = model;
  } else if (provider) {
    chosenProvider = provider;
    chosenModel = DEFAULT_MODELS[provider];
  } else {
    const hasGemini = !!env.GEMINI_API_KEY;
    const hasAnthropic = !!env.ANTHROPIC_API_KEY;
    if (hasGemini) {
      chosenProvider = "google";
    } else if (hasAnthropic) {
      chosenProvider = "anthropic";
    } else {
      throw new Error(
        "No provider selected and no API key found. Set ANTHROPIC_API_KEY or GEMINI_API_KEY, or pass --provider.",
      );
    }
    chosenModel = DEFAULT_MODELS[chosenProvider];
  }

  const envVar = KEY_ENV_VAR[chosenProvider];
  const apiKey = env[envVar];
  if (!apiKey) {
    throw new Error(
      `Missing ${envVar} environment variable (required for provider '${chosenProvider}').`,
    );
  }

  if (chosenProvider === "anthropic") {
    return createAnthropicAnalyzer(apiKey, chosenModel);
  }

  return createGeminiAnalyzer(apiKey, chosenModel);
}
