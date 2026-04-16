# Adding Anthropic Claude API Support

**Date:** 2026-04-17
**Status:** Approved — ready for implementation plan

## Goal

Add Anthropic Claude API as a second vision provider alongside the existing Gemini integration, so users can run design extraction with either model family and easily compare results across models (especially `claude-opus-4-7` vs `gemini-2.5-flash`).

## Non-goals

- Supporting providers beyond Google and Anthropic.
- Running both providers in parallel in a single invocation.
- Persisting model choice to a config file.

## CLI interface

```bash
# Default — Gemini (backward compatible)
copy-design https://stripe.com

# Use Claude via model auto-inference
copy-design https://stripe.com --model claude-opus-4-7
copy-design https://stripe.com --model claude-sonnet-4-6

# Explicit provider (rarely needed; disambiguation only)
copy-design https://stripe.com --provider anthropic
```

Flags:
- `--model <name>` — optional. Overrides provider default. Prefix determines provider when `--provider` is absent.
- `--provider <google|anthropic>` — optional. Explicit provider selection.

## Provider resolution

Applied in this order:

1. If `--model` is set → infer provider from prefix:
   - `claude-*` → `anthropic`
   - `gemini-*` → `google`
   - Unrecognized prefix → error listing supported prefixes.
2. If `--provider` is set → use it. If `--model` is absent, use that provider's default model. If both are set, they must agree or error.
3. If neither is set → inspect env vars:
   - Only `ANTHROPIC_API_KEY` present → `anthropic`.
   - Only `GEMINI_API_KEY` present → `google`.
   - Both present → `google` (backward compatible default).
   - Neither present → error.
4. After resolution, if the chosen provider's API key env var is missing → error telling the user which variable to export.

**Defaults:**
- `google` → `gemini-2.5-flash`
- `anthropic` → `claude-opus-4-7`

## Code structure

Split `src/analyze.ts` into a provider-based layout:

```
src/
  providers/
    types.ts        # DesignAnalyzer interface + shared schema description
    gemini.ts       # existing Gemini impl, moved
    anthropic.ts    # new Anthropic impl via @anthropic-ai/sdk tool use
    index.ts        # resolveProvider(opts) factory
  analyze.ts        # removed (callers use providers/index)
  index.ts          # wires CLI flags → resolveProvider → analyze
```

### Provider interface (`providers/types.ts`)

```ts
export interface DesignAnalyzer {
  analyze(screenshotPath: string): Promise<DesignAnalysis>;
}

export type ProviderName = "google" | "anthropic";

export interface ResolveOptions {
  model?: string;
  provider?: ProviderName;
  env: NodeJS.ProcessEnv;
}
```

### Gemini (`providers/gemini.ts`)

Existing implementation moves here unchanged. Export a factory:

```ts
export function createGeminiAnalyzer(apiKey: string, model: string): DesignAnalyzer;
```

### Anthropic (`providers/anthropic.ts`)

Uses `@anthropic-ai/sdk`. Anthropic has no `responseSchema` equivalent, so structured output is enforced via a single **tool use**:

- Declare a tool named `emit_design_analysis` whose `input_schema` mirrors the existing Gemini `responseSchema` field-for-field (same `DesignAnalysis` shape).
- Set `tool_choice: { type: "tool", name: "emit_design_analysis" }` to force invocation.
- Pass the screenshot as an `image` content block with `source: { type: "base64", media_type: "image/png", data: <base64> }`.
- Read the single `tool_use` block's `input` — that is the `DesignAnalysis`.

Prompt text reused from the current Gemini `PROMPT` constant verbatim.

### Factory (`providers/index.ts`)

`resolveProvider(opts: ResolveOptions)` implements the resolution logic above and returns a `DesignAnalyzer`. All key and model validation happens here so `src/index.ts` stays thin.

## Dependency changes

- **Add:** `@anthropic-ai/sdk` (latest stable).
- **Keep:** `@google/generative-ai`.

## Error messages

- Missing key for resolved provider:
  `Missing ANTHROPIC_API_KEY environment variable (required for provider 'anthropic').`
- Unknown model prefix:
  `Unrecognized model 'foo-3'. Expected a model starting with 'claude-' or 'gemini-', or pass --provider explicitly.`
- Conflicting flags:
  `--model 'claude-opus-4-7' implies provider 'anthropic', but --provider 'google' was passed.`
- Neither flag nor env var set:
  `No provider selected and no API key found. Set ANTHROPIC_API_KEY or GEMINI_API_KEY, or pass --provider.`

## Backward compatibility

- Invoking without new flags + only `GEMINI_API_KEY` set → identical behavior to today.
- Public output format (`DESIGN.md`, `DESIGN-preview.html`) unchanged.
- The `DesignAnalysis` type is unchanged; both providers produce the same shape.

## Testing

- Unit tests for `resolveProvider` covering the resolution matrix (all flag/env combinations, conflict cases, unknown prefixes).
- Keep the existing `tests/output.test.ts` as-is (provider-agnostic).
- No live API calls in tests — provider factories are covered by resolution tests; actual network behavior is verified manually during implementation.

## Open items

None at spec time.
