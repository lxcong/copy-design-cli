# Anthropic Claude API Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Anthropic Claude as a second vision provider alongside Gemini, selected via `--model` prefix or `--provider`, so users can extract design systems with either model family and compare results.

**Architecture:** Introduce a `DesignAnalyzer` interface under `src/providers/`. Move the existing Gemini implementation into `providers/gemini.ts`, add `providers/anthropic.ts` that uses the Claude tool-use API for structured output, and add `providers/index.ts` with a `resolveProvider()` factory that maps CLI flags and env vars to a concrete analyzer. The CLI becomes thin.

**Tech Stack:** TypeScript, Node 18+, `@google/generative-ai` (existing), `@anthropic-ai/sdk` (new), `commander`, `vitest`.

Spec: `docs/superpowers/specs/2026-04-17-anthropic-provider-design.md`

---

## File Structure

- `src/providers/types.ts` — new. `DesignAnalyzer` interface, `ProviderName` type, `ResolveOptions` type.
- `src/providers/prompt.ts` — new. Shared `PROMPT` string (moved from `analyze.ts`).
- `src/providers/gemini.ts` — new. Holds the current Gemini implementation as a `DesignAnalyzer` factory.
- `src/providers/anthropic.ts` — new. `@anthropic-ai/sdk` implementation using tool-use for structured output.
- `src/providers/index.ts` — new. Exports `resolveProvider(opts: ResolveOptions): DesignAnalyzer`.
- `src/analyze.ts` — deleted.
- `src/index.ts` — modified. Adds `--model` and `--provider` flags; replaces direct call to `analyzeScreenshot` with `resolveProvider(...).analyze(...)`.
- `tests/resolveProvider.test.ts` — new. Unit tests for the resolution matrix.
- `README.md` — modified. Document both providers and the two new flags.
- `package.json` — modified. Add `@anthropic-ai/sdk`.

---

## Task 1: Install @anthropic-ai/sdk

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install**

Run: `npm install @anthropic-ai/sdk@^0.90.0`

Expected: `package.json` gains `"@anthropic-ai/sdk": "^0.90.0"` under `dependencies`, `node_modules/@anthropic-ai/sdk` exists.

- [ ] **Step 2: Verify install**

Run: `node -e "import('@anthropic-ai/sdk').then(m => console.log(typeof m.default))"`
Expected: `function` (the default export is the client class).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk dependency"
```

---

## Task 2: Define provider types and shared prompt

**Files:**
- Create: `src/providers/types.ts`
- Create: `src/providers/prompt.ts`

- [ ] **Step 1: Create `src/providers/types.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/providers/prompt.ts`**

```ts
export const PROMPT = `You are an expert Design Systems Lead. Analyze this webpage screenshot and extract its design system following the Stitch DESIGN.md format.

Rules:
- All hex colors MUST be 6-digit: #RRGGBB
- Colors use role names (Primary, Secondary, Tertiary, Neutral) with hex and functional description
- Typography: list font families, then describe weight/size usage in natural language
- Elevation: describe the shadow approach (flat, soft shadows, heavy shadows, or border-based depth)
- Components: describe Buttons, Inputs, Cards style with exact values in parentheses
- Do's and Don'ts: practical guardrails for maintaining the design's consistency`;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (these files are not yet imported anywhere).

- [ ] **Step 4: Commit**

```bash
git add src/providers/types.ts src/providers/prompt.ts
git commit -m "feat: add provider types and shared prompt"
```

---

## Task 3: Write resolveProvider tests (TDD)

**Files:**
- Create: `tests/resolveProvider.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
import { describe, it, expect } from "vitest";
import { resolveProvider } from "../src/providers/index.js";

describe("resolveProvider", () => {
  describe("model prefix inference", () => {
    it("claude-* model routes to anthropic", () => {
      const a = resolveProvider({ model: "claude-opus-4-7", env: { ANTHROPIC_API_KEY: "x" } });
      expect(a.provider).toBe("anthropic");
      expect(a.model).toBe("claude-opus-4-7");
    });

    it("gemini-* model routes to google", () => {
      const a = resolveProvider({ model: "gemini-2.5-flash", env: { GEMINI_API_KEY: "x" } });
      expect(a.provider).toBe("google");
      expect(a.model).toBe("gemini-2.5-flash");
    });

    it("unknown prefix throws", () => {
      expect(() => resolveProvider({ model: "foo-3", env: {} }))
        .toThrow(/Unrecognized model 'foo-3'/);
    });
  });

  describe("explicit --provider", () => {
    it("provider anthropic with no model uses claude-opus-4-7", () => {
      const a = resolveProvider({ provider: "anthropic", env: { ANTHROPIC_API_KEY: "x" } });
      expect(a.provider).toBe("anthropic");
      expect(a.model).toBe("claude-opus-4-7");
    });

    it("provider google with no model uses gemini-2.5-flash", () => {
      const a = resolveProvider({ provider: "google", env: { GEMINI_API_KEY: "x" } });
      expect(a.provider).toBe("google");
      expect(a.model).toBe("gemini-2.5-flash");
    });

    it("model and provider agreeing is ok", () => {
      const a = resolveProvider({
        model: "claude-sonnet-4-6",
        provider: "anthropic",
        env: { ANTHROPIC_API_KEY: "x" },
      });
      expect(a.model).toBe("claude-sonnet-4-6");
    });

    it("model and provider disagreeing throws", () => {
      expect(() =>
        resolveProvider({
          model: "claude-opus-4-7",
          provider: "google",
          env: { ANTHROPIC_API_KEY: "x", GEMINI_API_KEY: "x" },
        }),
      ).toThrow(/implies provider 'anthropic', but --provider 'google' was passed/);
    });
  });

  describe("env var fallback", () => {
    it("only ANTHROPIC_API_KEY set routes to anthropic", () => {
      const a = resolveProvider({ env: { ANTHROPIC_API_KEY: "x" } });
      expect(a.provider).toBe("anthropic");
    });

    it("only GEMINI_API_KEY set routes to google", () => {
      const a = resolveProvider({ env: { GEMINI_API_KEY: "x" } });
      expect(a.provider).toBe("google");
    });

    it("both keys set defaults to google (backward compatible)", () => {
      const a = resolveProvider({ env: { GEMINI_API_KEY: "x", ANTHROPIC_API_KEY: "y" } });
      expect(a.provider).toBe("google");
    });

    it("no flags and no keys throws", () => {
      expect(() => resolveProvider({ env: {} }))
        .toThrow(/No provider selected and no API key found/);
    });
  });

  describe("missing API key after resolution", () => {
    it("resolved anthropic without ANTHROPIC_API_KEY throws", () => {
      expect(() => resolveProvider({ provider: "anthropic", env: {} }))
        .toThrow(/Missing ANTHROPIC_API_KEY/);
    });

    it("resolved google without GEMINI_API_KEY throws", () => {
      expect(() => resolveProvider({ provider: "google", env: {} }))
        .toThrow(/Missing GEMINI_API_KEY/);
    });
  });
});
```

- [ ] **Step 2: Run tests — expect all to fail with import error**

Run: `npx vitest run tests/resolveProvider.test.ts`
Expected: FAIL — `Failed to resolve import "../src/providers/index.js"`.

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/resolveProvider.test.ts
git commit -m "test: add resolveProvider matrix tests (failing)"
```

---

## Task 4: Implement resolveProvider with placeholder factories

**Files:**
- Create: `src/providers/index.ts`

Note: Real Gemini and Anthropic implementations land in Tasks 5 and 6. To keep tests fast and focused on resolution logic, this task uses factory stubs that do not construct SDK clients and whose `analyze` throws. The test file does not call `analyze()`, so stubs are fine.

- [ ] **Step 1: Create `src/providers/index.ts`**

```ts
import type {
  DesignAnalyzer,
  ProviderName,
  ResolveOptions,
} from "./types.js";
import { DEFAULT_MODELS } from "./types.js";

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
    // Real impl lands in Task 6; stub keeps resolution tests runnable.
    return {
      provider: "anthropic",
      model: chosenModel,
      analyze: async () => {
        throw new Error("anthropic analyzer not implemented yet");
      },
    };
  }

  return {
    provider: "google",
    model: chosenModel,
    analyze: async () => {
      throw new Error("google analyzer not implemented yet");
    },
  };
}
```

- [ ] **Step 2: Run tests — expect all pass**

Run: `npx vitest run tests/resolveProvider.test.ts`
Expected: PASS — 13 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/providers/index.ts
git commit -m "feat: implement resolveProvider with stub analyzers"
```

---

## Task 5: Move Gemini implementation into provider

**Files:**
- Create: `src/providers/gemini.ts`
- Modify: `src/providers/index.ts`
- Delete: `src/analyze.ts`

- [ ] **Step 1: Create `src/providers/gemini.ts`**

```ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import type { DesignAnalysis } from "../types.js";
import type { DesignAnalyzer } from "./types.js";
import { PROMPT } from "./prompt.js";

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overview: {
      type: SchemaType.STRING,
      description: "A holistic description of the design's look and feel. Describe the personality: playful or professional? Dense or spacious? Warm or cold? What emotion does it convey? 2-4 sentences.",
    },
    colors: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Role name: Primary, Secondary, Tertiary, Neutral, or a descriptive functional name" },
          hex: { type: SchemaType.STRING, description: "6-digit hex like #2665fd" },
          role: { type: SchemaType.STRING, description: "What the agent should use this color for, e.g. 'CTAs, active states, key interactive elements'" },
        },
        required: ["name", "hex", "role"],
      },
      description: "Primary, secondary, tertiary, and neutral palettes. Include 4-8 key colors.",
    },
    typography: {
      type: SchemaType.STRING,
      description: "Describe font families and their roles. Format like: 'Headline Font: Inter, Body Font: Inter'. Then describe weight usage for headlines vs body, typical sizes (e.g. 14-16px for body, 12px for labels), and any special treatments. 2-4 sentences.",
    },
    elevation: {
      type: SchemaType.STRING,
      description: "How the design conveys depth. Does it use shadows? If so, describe their quality (soft, harsh, none). Or is depth conveyed through borders and surface color variation? 1-3 sentences.",
    },
    components: {
      type: SchemaType.STRING,
      description: "Style guidance for key components. Cover: Buttons (variants, corner radius, fill style), Inputs (border, background, padding), Cards (elevation, border, corner radius). Use format like '- **Buttons**: Rounded (8px), primary uses brand fill, secondary uses outline'. One bullet per component type.",
    },
    dosAndDonts: {
      type: SchemaType.STRING,
      description: "4-6 practical guidelines as bullet points. Mix do's and don'ts. Format: '- Do use primary color only for the most important action per screen\\n- Don't mix rounded and sharp corners'. Focus on maintaining consistency.",
    },
    preview: {
      type: SchemaType.OBJECT,
      description: "Structured values for rendering a visual preview. Extract exact CSS values.",
      properties: {
        fontFamily: { type: SchemaType.STRING, description: "CSS font-family value like 'Inter, sans-serif'" },
        headingSizes: {
          type: SchemaType.OBJECT,
          properties: {
            h1: { type: SchemaType.STRING, description: "H1 size like 48px" },
            h2: { type: SchemaType.STRING, description: "H2 size like 32px" },
            h3: { type: SchemaType.STRING, description: "H3 size like 24px" },
          },
          required: ["h1", "h2", "h3"],
        },
        headingWeight: { type: SchemaType.NUMBER, description: "Heading font weight like 700" },
        bodySize: { type: SchemaType.STRING, description: "Body text size like 16px" },
        buttonRadius: { type: SchemaType.STRING, description: "Button border-radius like 8px" },
        cardRadius: { type: SchemaType.STRING, description: "Card border-radius like 12px" },
        cardShadow: { type: SchemaType.STRING, description: "Card box-shadow CSS value, or 'none'" },
      },
      required: ["fontFamily", "headingSizes", "headingWeight", "bodySize", "buttonRadius", "cardRadius", "cardShadow"],
    },
  },
  required: ["overview", "colors", "typography", "elevation", "components", "dosAndDonts", "preview"],
};

export function createGeminiAnalyzer(apiKey: string, model: string): DesignAnalyzer {
  return {
    provider: "google",
    model,
    async analyze(screenshotPath: string): Promise<DesignAnalysis> {
      const genAI = new GoogleGenerativeAI(apiKey);
      const client = genAI.getGenerativeModel({
        model,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        } as Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"],
      });

      const imageBuffer = await readFile(screenshotPath);
      const base64Image = imageBuffer.toString("base64");

      const result = await client.generateContent([
        PROMPT,
        { inlineData: { mimeType: "image/png", data: base64Image } },
      ]);

      return JSON.parse(result.response.text().trim()) as DesignAnalysis;
    },
  };
}
```

- [ ] **Step 2: Replace the Google stub in `src/providers/index.ts`**

In `src/providers/index.ts`, add the import at the top:

```ts
import { createGeminiAnalyzer } from "./gemini.js";
```

Then replace the final `return { provider: "google", ... }` block with:

```ts
  return createGeminiAnalyzer(apiKey, chosenModel);
```

- [ ] **Step 3: Delete `src/analyze.ts`**

Run: `git rm src/analyze.ts`

- [ ] **Step 4: Verify nothing else imports `./analyze.js`**

Run: `npx tsc --noEmit`
Expected: may fail at `src/index.ts` because `index.ts` still imports `./analyze.js` — that's expected and will be fixed in Task 7. If `tsc` errors come from anywhere else, investigate.

- [ ] **Step 5: Run resolve tests (still should pass)**

Run: `npx vitest run tests/resolveProvider.test.ts`
Expected: PASS — 13 tests.

- [ ] **Step 6: Commit**

```bash
git add src/providers/gemini.ts src/providers/index.ts src/analyze.ts
git commit -m "refactor: move Gemini into providers/gemini.ts"
```

---

## Task 6: Implement Anthropic provider

**Files:**
- Create: `src/providers/anthropic.ts`
- Modify: `src/providers/index.ts`

- [ ] **Step 1: Create `src/providers/anthropic.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import type { DesignAnalysis } from "../types.js";
import type { DesignAnalyzer } from "./types.js";
import { PROMPT } from "./prompt.js";

const inputSchema = {
  type: "object",
  properties: {
    overview: {
      type: "string",
      description: "A holistic description of the design's look and feel. Describe the personality: playful or professional? Dense or spacious? Warm or cold? What emotion does it convey? 2-4 sentences.",
    },
    colors: {
      type: "array",
      description: "Primary, secondary, tertiary, and neutral palettes. Include 4-8 key colors.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Role name: Primary, Secondary, Tertiary, Neutral, or a descriptive functional name" },
          hex: { type: "string", description: "6-digit hex like #2665fd" },
          role: { type: "string", description: "What the agent should use this color for" },
        },
        required: ["name", "hex", "role"],
      },
    },
    typography: {
      type: "string",
      description: "Describe font families and their roles. Then describe weight usage for headlines vs body, typical sizes, and any special treatments. 2-4 sentences.",
    },
    elevation: {
      type: "string",
      description: "How the design conveys depth. Shadows? Borders? Surface color variation? 1-3 sentences.",
    },
    components: {
      type: "string",
      description: "Style guidance for Buttons, Inputs, Cards with exact values in parentheses. One bullet per component type.",
    },
    dosAndDonts: {
      type: "string",
      description: "4-6 practical guidelines as bullet points. Mix do's and don'ts.",
    },
    preview: {
      type: "object",
      description: "Structured values for rendering a visual preview. Extract exact CSS values.",
      properties: {
        fontFamily: { type: "string", description: "CSS font-family value like 'Inter, sans-serif'" },
        headingSizes: {
          type: "object",
          properties: {
            h1: { type: "string", description: "H1 size like 48px" },
            h2: { type: "string", description: "H2 size like 32px" },
            h3: { type: "string", description: "H3 size like 24px" },
          },
          required: ["h1", "h2", "h3"],
        },
        headingWeight: { type: "number", description: "Heading font weight like 700" },
        bodySize: { type: "string", description: "Body text size like 16px" },
        buttonRadius: { type: "string", description: "Button border-radius like 8px" },
        cardRadius: { type: "string", description: "Card border-radius like 12px" },
        cardShadow: { type: "string", description: "Card box-shadow CSS value, or 'none'" },
      },
      required: ["fontFamily", "headingSizes", "headingWeight", "bodySize", "buttonRadius", "cardRadius", "cardShadow"],
    },
  },
  required: ["overview", "colors", "typography", "elevation", "components", "dosAndDonts", "preview"],
} as const;

const TOOL_NAME = "emit_design_analysis";

export function createAnthropicAnalyzer(apiKey: string, model: string): DesignAnalyzer {
  return {
    provider: "anthropic",
    model,
    async analyze(screenshotPath: string): Promise<DesignAnalysis> {
      const client = new Anthropic({ apiKey });

      const imageBuffer = await readFile(screenshotPath);
      const base64Image = imageBuffer.toString("base64");

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        tools: [
          {
            name: TOOL_NAME,
            description: "Emit the extracted design system as structured JSON.",
            input_schema: inputSchema as unknown as Anthropic.Tool["input_schema"],
          },
        ],
        tool_choice: { type: "tool", name: TOOL_NAME },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock =>
          block.type === "tool_use" && block.name === TOOL_NAME,
      );
      if (!toolUse) {
        throw new Error(
          `Anthropic response did not contain a '${TOOL_NAME}' tool_use block. stop_reason=${response.stop_reason}`,
        );
      }

      return toolUse.input as DesignAnalysis;
    },
  };
}
```

- [ ] **Step 2: Replace the Anthropic stub in `src/providers/index.ts`**

In `src/providers/index.ts`, add the import near the Gemini one:

```ts
import { createAnthropicAnalyzer } from "./anthropic.js";
```

Then replace the `if (chosenProvider === "anthropic") { return { ... stub ... }; }` block with:

```ts
  if (chosenProvider === "anthropic") {
    return createAnthropicAnalyzer(apiKey, chosenModel);
  }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: may still fail at `src/index.ts` (fixed in Task 7). All other files compile cleanly.

- [ ] **Step 4: Run resolve tests**

Run: `npx vitest run tests/resolveProvider.test.ts`
Expected: PASS — 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/providers/anthropic.ts src/providers/index.ts
git commit -m "feat: add anthropic provider via tool-use structured output"
```

---

## Task 7: Wire CLI flags

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Rewrite `src/index.ts`**

Full replacement contents:

```ts
import { program } from "commander";
import ora from "ora";
import { unlink, writeFile } from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { resolveProvider } from "./providers/index.js";
import type { ProviderName } from "./providers/types.js";
import { buildDesignMd } from "./output.js";
import { buildPreviewHtml } from "./preview.js";
import type { DeviceType } from "./types.js";

program
  .name("copy-design")
  .description("Extract design system from any webpage URL into DESIGN.md")
  .argument("<url>", "Webpage URL to analyze")
  .option("-o, --output <path>", "Output file path", "./DESIGN.md")
  .option("-d, --device <type>", "Device type: DESKTOP, MOBILE, TABLET", "DESKTOP")
  .option("-m, --model <name>", "Model name, e.g. claude-opus-4-7 or gemini-2.5-flash")
  .option("-p, --provider <name>", "Provider: google or anthropic")
  .action(
    async (
      url: string,
      opts: {
        output: string;
        device: string;
        model?: string;
        provider?: string;
      },
    ) => {
      const device = opts.device.toUpperCase() as DeviceType;
      if (!["DESKTOP", "MOBILE", "TABLET"].includes(device)) {
        console.error(`Invalid device type: ${opts.device}. Use DESKTOP, MOBILE, or TABLET.`);
        process.exit(1);
      }

      let provider: ProviderName | undefined;
      if (opts.provider) {
        const normalized = opts.provider.toLowerCase();
        if (normalized !== "google" && normalized !== "anthropic") {
          console.error(`Invalid provider: ${opts.provider}. Use google or anthropic.`);
          process.exit(1);
        }
        provider = normalized;
      }

      let analyzer;
      try {
        analyzer = resolveProvider({
          model: opts.model,
          provider,
          env: process.env,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(message);
        process.exit(1);
      }

      let screenshotPath: string | undefined;

      try {
        const spinner1 = ora("Taking screenshot...").start();
        screenshotPath = await takeScreenshot(url, device);
        spinner1.succeed("Screenshot captured");

        const spinner2 = ora(
          `Analyzing design with ${analyzer.provider} (${analyzer.model})...`,
        ).start();
        const analysis = await analyzer.analyze(screenshotPath);
        spinner2.succeed("Design analysis complete");

        const spinner3 = ora("Writing DESIGN.md + preview.html...").start();
        const markdown = buildDesignMd(analysis, url);
        const preview = buildPreviewHtml(analysis, url);
        const previewPath = opts.output.replace(/\.md$/i, "-preview.html");
        await writeFile(opts.output, markdown, "utf-8");
        await writeFile(previewPath, preview, "utf-8");
        spinner3.succeed(`DESIGN.md saved to ${opts.output}`);
        console.log(`  Preview: ${previewPath}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nError: ${message}`);
        process.exit(1);
      } finally {
        if (screenshotPath) {
          await unlink(screenshotPath).catch(() => {});
        }
      }
    },
  );

program.parse();
```

- [ ] **Step 2: Typecheck entire project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `dist/index.js` is produced, no errors.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all tests pass (output.test.ts + resolveProvider.test.ts).

- [ ] **Step 5: CLI smoke test — help text shows new flags**

Run: `node dist/index.js --help`
Expected: output includes `-m, --model <name>` and `-p, --provider <name>` entries.

- [ ] **Step 6: CLI smoke test — missing keys error**

Run: `env -i PATH=$PATH node dist/index.js https://example.com 2>&1 | head -3`
Expected: stderr contains `No provider selected and no API key found`. Exit code non-zero.

- [ ] **Step 7: CLI smoke test — explicit anthropic without key errors**

Run: `env -i PATH=$PATH node dist/index.js https://example.com --provider anthropic 2>&1 | head -3`
Expected: stderr contains `Missing ANTHROPIC_API_KEY`.

- [ ] **Step 8: CLI smoke test — unknown model errors**

Run: `env -i PATH=$PATH node dist/index.js https://example.com --model foo-3 2>&1 | head -3`
Expected: stderr contains `Unrecognized model 'foo-3'`.

- [ ] **Step 9: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire --model and --provider CLI flags"
```

---

## Task 8: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the "Powered by" line near the top**

Replace:

```markdown
Powered by **Gemini 2.5 Flash** vision analysis.
```

With:

```markdown
Powered by vision analysis — supports **Gemini 2.5 Flash** (default) and **Claude** (Opus 4.7, Sonnet 4.6, and others).
```

- [ ] **Step 2: Replace the "Setup" section**

Replace the block starting with `## Setup` and ending just before `## Usage` with:

````markdown
## Setup

Set at least one API key. The tool picks a provider based on which key is present, or you can force one with `--model` / `--provider`.

```bash
# Gemini (default when both are set)
export GEMINI_API_KEY="your-gemini-api-key"

# Anthropic Claude
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

- Gemini key: [Google AI Studio](https://aistudio.google.com/apikey)
- Anthropic key: [Anthropic Console](https://console.anthropic.com/)
````

- [ ] **Step 3: Append new examples inside the "Usage" section**

After the existing `-d TABLET` example, insert:

````markdown

# Use Claude (provider inferred from model prefix)
copy-design https://stripe.com --model claude-opus-4-7

# Compare a specific Claude model
copy-design https://stripe.com --model claude-sonnet-4-6 -o ./stripe-claude.md

# Force a provider (uses its default model)
copy-design https://stripe.com --provider anthropic
````

- [ ] **Step 4: Update the "Tech stack" section**

Add a bullet after the Gemini line:

```markdown
- [Claude 4.x](https://docs.claude.com/) — Anthropic's vision models (Opus 4.7 default), structured output via tool use
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document Anthropic provider support"
```

---

## Self-Review Checklist

Run through this before handing off.

- **Spec coverage:**
  - CLI interface (spec §CLI interface) → Task 7.
  - Provider resolution rules (spec §Provider resolution, all 4 steps + defaults) → Task 4 (+ Task 3 tests covering the matrix).
  - Code structure (spec §Code structure) → Tasks 2, 5, 6.
  - Dependency change (spec §Dependency changes) → Task 1.
  - Error messages (spec §Error messages) — four exact strings: Task 4 (all four), Tasks 7 smoke tests verify three of them end-to-end.
  - Backward compatibility (spec §Backward compatibility) → Task 7's default path; also covered by the "only GEMINI_API_KEY set" test in Task 3.
  - Testing (spec §Testing) → Task 3 unit matrix + Task 7 smoke tests. No live API calls.

- **Placeholder scan:** No "TBD", "handle edge cases", or "similar to above". Every code step has complete code.

- **Type consistency:** `DesignAnalyzer` interface used identically in Tasks 2, 4, 5, 6. `ProviderName` values are `"google" | "anthropic"` everywhere. `DEFAULT_MODELS` keys match `ProviderName`.
