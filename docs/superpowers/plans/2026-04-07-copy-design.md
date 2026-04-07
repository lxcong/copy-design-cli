# copy-design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool that takes any webpage URL, screenshots it, analyzes the design with Gemini, recreates it with Stitch SDK, and outputs a DESIGN.md with design tokens + HTML/CSS code.

**Architecture:** 5-module pipeline: screenshot (Puppeteer) → analyze (Gemini 2.5 Flash) → stitch (Stitch SDK) → output (markdown assembly), wired together by a CLI entry (Commander). Each module is a single file with one exported async function.

**Tech Stack:** TypeScript, Node.js, tsup, commander, puppeteer, @google/generative-ai, @google/stitch-sdk, ora

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, bin entry, scripts |
| `tsconfig.json` | TypeScript config (ESM, strict) |
| `tsup.config.ts` | Bundle to `dist/index.js` |
| `src/types.ts` | Shared interfaces: `DesignAnalysis`, `DeviceType` |
| `src/screenshot.ts` | Puppeteer: URL → temp PNG path |
| `src/analyze.ts` | Gemini: PNG → `DesignAnalysis` JSON |
| `src/stitch.ts` | Stitch SDK: prompt → HTML string |
| `src/output.ts` | `DesignAnalysis` + HTML → DESIGN.md string |
| `src/index.ts` | CLI entry: commander + ora + pipeline wiring |
| `tests/output.test.ts` | Unit tests for markdown assembly |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "copy-design",
  "version": "0.1.0",
  "description": "Extract design system from any webpage URL into DESIGN.md",
  "type": "module",
  "bin": {
    "copy-design": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.0",
    "@google/stitch-sdk": "^0.1.0",
    "commander": "^13.0.0",
    "ora": "^8.0.0",
    "puppeteer": "^24.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, `package-lock.json` generated, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts package-lock.json
git commit -m "chore: scaffold project with deps"
```

---

### Task 2: Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create types.ts**

```typescript
export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET";

export interface DesignAnalysis {
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    error: string;
    success: string;
  };
  typography: {
    fontFamily: string;
    h1: { size: string; weight: number };
    h2: { size: string; weight: number };
    h3: { size: string; weight: number };
    body: { size: string; weight: number };
    caption: { size: string; weight: number };
  };
  spacing: {
    baseUnit: string;
    values: number[];
  };
  layout: {
    description: string;
    maxWidth: string;
    columns: number;
  };
  components: {
    buttonRadius: string;
    cardRadius: string;
    cardShadow: string;
    inputBorder: string;
  };
  designPrompt: string;
}

export const VIEWPORTS: Record<DeviceType, { width: number; height: number }> = {
  DESKTOP: { width: 1440, height: 900 },
  MOBILE: { width: 390, height: 844 },
  TABLET: { width: 820, height: 1180 },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types for DesignAnalysis and DeviceType"
```

---

### Task 3: Output Module (TDD)

**Files:**
- Create: `tests/output.test.ts`
- Create: `src/output.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { buildDesignMd } from "../src/output.js";
import type { DesignAnalysis } from "../src/types.js";

const MOCK_ANALYSIS: DesignAnalysis = {
  theme: "Light, minimal corporate design with clean lines and ample whitespace",
  colors: {
    primary: "#1A73E8",
    secondary: "#34A853",
    accent: "#FBBC04",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    textPrimary: "#202124",
    textSecondary: "#5F6368",
    error: "#EA4335",
    success: "#34A853",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: { size: "32px", weight: 700 },
    h2: { size: "24px", weight: 600 },
    h3: { size: "20px", weight: 600 },
    body: { size: "16px", weight: 400 },
    caption: { size: "12px", weight: 400 },
  },
  spacing: {
    baseUnit: "8px",
    values: [4, 8, 16, 24, 32, 48, 64],
  },
  layout: {
    description: "Top navigation bar with centered content area and footer",
    maxWidth: "1200px",
    columns: 12,
  },
  components: {
    buttonRadius: "8px",
    cardRadius: "12px",
    cardShadow: "0 1px 3px rgba(0,0,0,0.12)",
    inputBorder: "1px solid #DADCE0",
  },
  designPrompt: "A light minimal corporate page",
};

const MOCK_HTML = "<html><body><h1>Hello</h1></body></html>";

describe("buildDesignMd", () => {
  it("includes all 9 sections plus source code", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, MOCK_HTML, "https://example.com");
    expect(md).toContain("## Visual Theme & Atmosphere");
    expect(md).toContain("## Color Palette & Roles");
    expect(md).toContain("## Typography Rules");
    expect(md).toContain("## Spacing & Layout");
    expect(md).toContain("## Component Styles");
    expect(md).toContain("## Depth & Elevation");
    expect(md).toContain("## Do's and Don'ts");
    expect(md).toContain("## Responsive Behavior");
    expect(md).toContain("## Agent Prompt Guide");
    expect(md).toContain("## Source Code");
  });

  it("includes actual color values", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, MOCK_HTML, "https://example.com");
    expect(md).toContain("#1A73E8");
    expect(md).toContain("#34A853");
    expect(md).toContain("#FFFFFF");
  });

  it("includes typography details", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, MOCK_HTML, "https://example.com");
    expect(md).toContain("Inter, sans-serif");
    expect(md).toContain("32px");
    expect(md).toContain("700");
  });

  it("includes HTML source code", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, MOCK_HTML, "https://example.com");
    expect(md).toContain(MOCK_HTML);
  });

  it("includes source URL", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, MOCK_HTML, "https://example.com");
    expect(md).toContain("https://example.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/output.test.ts`
Expected: FAIL — `buildDesignMd` not found.

- [ ] **Step 3: Write the implementation**

```typescript
import type { DesignAnalysis } from "./types.js";

export function buildDesignMd(
  analysis: DesignAnalysis,
  html: string,
  sourceUrl: string,
): string {
  const { colors, typography, spacing, layout, components } = analysis;

  return `# DESIGN.md

> Extracted from [${sourceUrl}](${sourceUrl})

## Visual Theme & Atmosphere

${analysis.theme}

## Color Palette & Roles

| Token | Value | Usage |
|-------|-------|-------|
| Primary | ${colors.primary} | Primary actions, links, focus states |
| Secondary | ${colors.secondary} | Secondary actions, supporting elements |
| Accent | ${colors.accent} | Highlights, badges, callouts |
| Background | ${colors.background} | Page background |
| Surface | ${colors.surface} | Cards, elevated containers |
| Text Primary | ${colors.textPrimary} | Headings, body text |
| Text Secondary | ${colors.textSecondary} | Captions, placeholders |
| Error | ${colors.error} | Error states, destructive actions |
| Success | ${colors.success} | Success states, confirmations |

## Typography Rules

- **Font Family:** ${typography.fontFamily}
- **H1:** ${typography.h1.size}, weight ${typography.h1.weight}
- **H2:** ${typography.h2.size}, weight ${typography.h2.weight}
- **H3:** ${typography.h3.size}, weight ${typography.h3.weight}
- **Body:** ${typography.body.size}, weight ${typography.body.weight}
- **Caption:** ${typography.caption.size}, weight ${typography.caption.weight}

## Spacing & Layout

- **Base unit:** ${spacing.baseUnit}
- **Scale:** ${spacing.values.join(", ")}px
- **Max width:** ${layout.maxWidth}
- **Grid:** ${layout.columns} columns
- **Structure:** ${layout.description}

## Component Styles

- **Button border-radius:** ${components.buttonRadius}
- **Card border-radius:** ${components.cardRadius}
- **Card shadow:** ${components.cardShadow}
- **Input border:** ${components.inputBorder}

## Depth & Elevation

- **Level 0 (flat):** No shadow — backgrounds, inline elements
- **Level 1 (cards):** ${components.cardShadow}
- **Level 2 (dropdowns):** Increase blur and offset from card shadow for popups

## Do's and Don'ts

**Do:**
- Use the primary color for main CTAs and interactive elements
- Maintain consistent spacing using the ${spacing.baseUnit} grid
- Use the font hierarchy to establish visual priority

**Don't:**
- Mix more than 2 font families
- Use colors outside the defined palette
- Break the spacing scale with arbitrary pixel values

## Responsive Behavior

- **Desktop:** Max width ${layout.maxWidth}, ${layout.columns}-column grid
- **Tablet (≤1024px):** Reduce to 8 columns, stack secondary content
- **Mobile (≤640px):** Single column, full-width cards, increase touch targets to 44px

## Agent Prompt Guide

**Quick palette:** Primary ${colors.primary}, Secondary ${colors.secondary}, Accent ${colors.accent}, BG ${colors.background}

**Reusable prompt:**
> ${analysis.designPrompt}

---

## Source Code

\`\`\`html
${html}
\`\`\`
`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/output.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/output.ts tests/output.test.ts
git commit -m "feat: add output module with DESIGN.md assembly"
```

---

### Task 4: Screenshot Module

**Files:**
- Create: `src/screenshot.ts`

- [ ] **Step 1: Create screenshot.ts**

```typescript
import puppeteer from "puppeteer";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import type { DeviceType } from "./types.js";
import { VIEWPORTS } from "./types.js";

export async function takeScreenshot(
  url: string,
  device: DeviceType,
): Promise<string> {
  const viewport = VIEWPORTS[device];
  const outputPath = join(tmpdir(), `copy-design-${randomUUID()}.png`);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    }

    await page.screenshot({ path: outputPath, fullPage: true });
    return outputPath;
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/screenshot.ts
git commit -m "feat: add screenshot module with Puppeteer"
```

---

### Task 5: Analyze Module

**Files:**
- Create: `src/analyze.ts`

- [ ] **Step 1: Create analyze.ts**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import type { DesignAnalysis } from "./types.js";

const PROMPT = `You are an expert UI/UX designer. Analyze this webpage screenshot and extract its design system.

Return ONLY a valid JSON object with this exact structure (no markdown fencing, no explanation):

{
  "theme": "Light/Dark, brief style description (e.g. 'Dark, minimal SaaS with neon accents')",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "textPrimary": "#hex",
    "textSecondary": "#hex",
    "error": "#hex (estimate if not visible)",
    "success": "#hex (estimate if not visible)"
  },
  "typography": {
    "fontFamily": "detected font family with fallback",
    "h1": { "size": "px value", "weight": number },
    "h2": { "size": "px value", "weight": number },
    "h3": { "size": "px value", "weight": number },
    "body": { "size": "px value", "weight": number },
    "caption": { "size": "px value", "weight": number }
  },
  "spacing": {
    "baseUnit": "px value",
    "values": [array of common spacing values in px]
  },
  "layout": {
    "description": "Page structure: navigation, content areas, sidebar, footer",
    "maxWidth": "px value",
    "columns": number
  },
  "components": {
    "buttonRadius": "px value",
    "cardRadius": "px value",
    "cardShadow": "CSS shadow value",
    "inputBorder": "CSS border value"
  },
  "designPrompt": "A detailed 2-3 sentence description suitable for Stitch to recreate this design. Include: layout structure, color scheme, typography style, component shapes, and overall aesthetic. Be specific about visual details."
}

Be precise with hex color values. Estimate sizes based on visual proportions.`;

export async function analyzeScreenshot(
  screenshotPath: string,
  apiKey: string,
): Promise<DesignAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imageBuffer = await readFile(screenshotPath);
  const base64Image = imageBuffer.toString("base64");

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text().trim();
  // Strip markdown code fences if model includes them despite instructions
  const cleaned = text.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "");
  return JSON.parse(cleaned) as DesignAnalysis;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/analyze.ts
git commit -m "feat: add analyze module with Gemini vision"
```

---

### Task 6: Stitch Module

**Files:**
- Create: `src/stitch.ts`

- [ ] **Step 1: Create stitch.ts**

```typescript
import { stitch as stitchClient } from "@google/stitch-sdk";
import type { DeviceType } from "./types.js";

export async function generateWithStitch(
  designPrompt: string,
  device: DeviceType,
  apiKey: string,
): Promise<string> {
  // stitch-sdk reads STITCH_API_KEY from env, but we set it explicitly
  process.env.STITCH_API_KEY = apiKey;

  // Create a project for this extraction
  const result = await stitchClient.callTool("create_project", {
    title: `copy-design-${Date.now()}`,
  });
  const projectId = (result as { projectId: string }).projectId;
  const project = stitchClient.project(projectId);

  // Generate screen from the design description
  const screen = await project.generate(designPrompt, device);

  // Get the HTML code
  const htmlUrl = await screen.getHtml();
  const response = await fetch(htmlUrl);
  const html = await response.text();

  return html;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/stitch.ts
git commit -m "feat: add stitch module for screen generation"
```

---

### Task 7: CLI Entry

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
import { program } from "commander";
import ora from "ora";
import { unlink } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./analyze.js";
import { generateWithStitch } from "./stitch.js";
import { buildDesignMd } from "./output.js";
import type { DeviceType } from "./types.js";

program
  .name("copy-design")
  .description("Extract design system from any webpage URL into DESIGN.md")
  .argument("<url>", "Webpage URL to analyze")
  .option("-o, --output <path>", "Output file path", "./DESIGN.md")
  .option("-d, --device <type>", "Device type: DESKTOP, MOBILE, TABLET", "DESKTOP")
  .action(async (url: string, opts: { output: string; device: string }) => {
    const device = opts.device.toUpperCase() as DeviceType;
    if (!["DESKTOP", "MOBILE", "TABLET"].includes(device)) {
      console.error(`Invalid device type: ${opts.device}. Use DESKTOP, MOBILE, or TABLET.`);
      process.exit(1);
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("Missing GEMINI_API_KEY environment variable.");
      process.exit(1);
    }
    const stitchKey = process.env.STITCH_API_KEY;
    if (!stitchKey) {
      console.error("Missing STITCH_API_KEY environment variable.");
      process.exit(1);
    }

    let screenshotPath: string | undefined;

    try {
      // Step 1: Screenshot
      const spinner1 = ora("Taking screenshot...").start();
      screenshotPath = await takeScreenshot(url, device);
      spinner1.succeed("Screenshot captured");

      // Step 2: Analyze
      const spinner2 = ora("Analyzing design with Gemini...").start();
      const analysis = await analyzeScreenshot(screenshotPath, geminiKey);
      spinner2.succeed("Design analysis complete");

      // Step 3: Stitch
      const spinner3 = ora("Generating with Stitch...").start();
      const html = await generateWithStitch(analysis.designPrompt, device, stitchKey);
      spinner3.succeed("Stitch generation complete");

      // Step 4: Output
      const spinner4 = ora("Writing DESIGN.md...").start();
      const markdown = buildDesignMd(analysis, html, url);
      await writeFile(opts.output, markdown, "utf-8");
      spinner4.succeed(`DESIGN.md saved to ${opts.output}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}`);
      process.exit(1);
    } finally {
      if (screenshotPath) {
        await unlink(screenshotPath).catch(() => {});
      }
    }
  });

program.parse();
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Build**

Run: `npx tsup`
Expected: `dist/index.js` created with shebang, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry with commander and ora"
```

---

### Task 8: Build, Link, and Smoke Test

**Files:**
- Modify: `dist/index.js` (generated)

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: `dist/index.js` exists, starts with `#!/usr/bin/env node`.

- [ ] **Step 2: Make binary executable and link**

Run: `chmod +x dist/index.js && npm link`
Expected: `copy-design` command now available globally.

- [ ] **Step 3: Verify help output**

Run: `copy-design --help`
Expected output includes:
```
Usage: copy-design [options] <url>

Extract design system from any webpage URL into DESIGN.md

Arguments:
  url                    Webpage URL to analyze

Options:
  -o, --output <path>    Output file path (default: "./DESIGN.md")
  -d, --device <type>    Device type: DESKTOP, MOBILE, TABLET (default: "DESKTOP")
  -h, --help             display help for command
```

- [ ] **Step 4: Verify env var check works**

Run: `copy-design https://example.com` (without setting env vars)
Expected: Error message `Missing GEMINI_API_KEY environment variable.`

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: All output module tests pass.

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: verify build and CLI smoke test"
```

---

### Task 9: End-to-End Test (requires API keys)

**Files:** None (manual verification)

- [ ] **Step 1: Set environment variables**

```bash
export GEMINI_API_KEY="your-gemini-key"
export STITCH_API_KEY="your-stitch-key"
```

- [ ] **Step 2: Run against a real URL**

Run: `copy-design https://stripe.com -o ./test-output.md`
Expected: All 4 spinners succeed, `test-output.md` created with all 10 sections.

- [ ] **Step 3: Verify output format**

Open `test-output.md` and verify:
- Contains `## Visual Theme & Atmosphere` with meaningful description
- Contains `## Color Palette & Roles` with hex values in table
- Contains `## Typography Rules` with font family and sizes
- Contains `## Source Code` with HTML content
- Source URL `https://stripe.com` appears in the header

- [ ] **Step 4: Clean up test output**

Run: `rm test-output.md`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: complete end-to-end verification"
```
