# copy-design

Extract the design system from any webpage URL into a `DESIGN.md` + visual `preview.html`.

Powered by vision analysis — supports **Gemini 2.5 Flash** (default) and **Claude** (Opus 4.7, Sonnet 4.6, and others).

## How it works

```
URL → screenshot → vision analysis → DESIGN.md + preview.html
```

**Step 1 — Screenshot**

Puppeteer launches a headless browser, loads the target URL, and captures a full-page screenshot. The viewport adapts to your chosen device: `DESKTOP` (1440×900), `TABLET` (820×1180), or `MOBILE` (390×844). The screenshot is a temporary file, deleted after the run.

**Step 2 — Vision analysis**

The screenshot is sent to a vision model (Gemini or Claude). The model acts as a Design Systems Lead: it reads every visual detail — color roles, type scale, spacing rhythm, component shapes, elevation approach — and returns a structured design analysis.

**Step 3 — Output**

Two files are written to disk:

| File | Content |
|------|---------|
| `DESIGN.md` | Design tokens in [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) format |
| `DESIGN-preview.html` | Interactive visual catalog — open in a browser to see color swatches, type scale, and component samples |

## Install

```bash
npm install -g copy-design-cli
```

Or run without installing:

```bash
npx copy-design-cli https://example.com
```

## Setup

Set at least one API key. The tool picks a provider based on which key is present, or you can override with `--model` / `--provider`.

```bash
# Gemini (default when both keys are set)
export GEMINI_API_KEY="your-gemini-api-key"

# Anthropic Claude
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

Get your keys:

- Gemini: [Google AI Studio](https://aistudio.google.com/apikey)
- Anthropic: [Anthropic Console](https://console.anthropic.com/)

## Usage

```bash
# Basic — outputs DESIGN.md + DESIGN-preview.html in current directory
copy-design https://stripe.com

# Custom output path
copy-design https://stripe.com -o ./stripe-design.md

# Mobile viewport
copy-design https://stripe.com -d MOBILE

# Tablet viewport
copy-design https://stripe.com -d TABLET

# Use a specific Claude model
copy-design https://stripe.com --model claude-opus-4-7

# Use a specific Gemini model
copy-design https://stripe.com --model gemini-2.5-flash

# Force a provider (uses its default model)
copy-design https://stripe.com --provider anthropic
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `-o, --output <path>` | `./DESIGN.md` | Output file path |
| `-d, --device <type>` | `DESKTOP` | Viewport: `DESKTOP`, `MOBILE`, `TABLET` |
| `-m, --model <name>` | _(auto)_ | Model name, e.g. `claude-opus-4-7` or `gemini-2.5-flash` |
| `-p, --provider <name>` | _(auto)_ | Provider: `google` or `anthropic` |

### Provider selection

When no `--model` or `--provider` is given, the tool auto-selects:

1. **Gemini** if `GEMINI_API_KEY` is set
2. **Anthropic** if `ANTHROPIC_API_KEY` is set (and no Gemini key)

Passing `--model claude-*` automatically selects the Anthropic provider. Passing `--model gemini-*` selects Google. You don't need to set `--provider` separately unless you want to use the provider's default model without specifying the model name.

## DESIGN.md format

Follows the [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) standard with these sections:

- **Visual Theme & Atmosphere** — overall aesthetic and mood
- **Color Palette & Roles** — named color tokens with hex values and usage
- **Typography Rules** — font families, weight/size usage in natural language
- **Spacing & Layout** — base unit, scale, max-width, grid structure
- **Component Styles** — buttons, inputs, cards with exact border-radius/shadow values
- **Depth & Elevation** — shadow approach (flat, soft, heavy, or border-based)
- **Do's and Don'ts** — guardrails for maintaining the design's consistency
- **Responsive Behavior** — breakpoints and layout shifts
- **Agent Prompt Guide** — ready-to-use prompt snippets for AI-assisted UI work

## Tech stack

- [Puppeteer](https://pptr.dev/) — headless browser screenshots
- [Gemini 2.5 Flash](https://ai.google.dev/) — vision-based design analysis (structured output)
- [Claude 4.x](https://docs.anthropic.com/) — Anthropic vision models, structured output via tool use
- [Commander](https://github.com/tj/commander.js) — CLI framework
- [ora](https://github.com/sindresorhus/ora) — progress spinners
- [tsup](https://tsup.egoist.dev/) — zero-config TypeScript bundler

## Limitations

- Pages behind login walls or CAPTCHAs cannot be screenshotted
- Extracted color values are vision-approximated, not pixel-exact CSS values
- Requires Node.js 18+

## License

MIT
