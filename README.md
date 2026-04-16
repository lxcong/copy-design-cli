# copy-design

Extract the design system from any webpage URL into a `DESIGN.md` + visual `preview.html`.

Powered by vision analysis — supports **Gemini 2.5 Flash** (default) and **Claude** (Opus 4.7, Sonnet 4.6, and others).

## How it works

```
URL → Puppeteer screenshot → Gemini analyzes design → DESIGN.md + preview.html
```

1. Takes a full-page screenshot of the target URL
2. Gemini 2.5 Flash analyzes the screenshot and extracts design tokens (colors, typography, spacing, layout, components)
3. Outputs a structured `DESIGN.md` and a visual `preview.html` (interactive design token catalog)

## Install

```bash
npm install -g copy-design
```

Or run directly:

```bash
npx copy-design https://example.com
```

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

# Use Claude (provider inferred from model prefix)
copy-design https://stripe.com --model claude-opus-4-7

# Compare a specific Claude model
copy-design https://stripe.com --model claude-sonnet-4-6 -o ./stripe-claude.md

# Force a provider (uses its default model)
copy-design https://stripe.com --provider anthropic
```

### Output files

| File | Content |
|------|---------|
| `DESIGN.md` | Design tokens: colors, typography, spacing, layout, components, agent prompt guide |
| `DESIGN-preview.html` | Visual design token catalog — open in browser to see colors, type scale, buttons, cards |

## DESIGN.md format

Follows the [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) standard:

- Visual Theme & Atmosphere
- Color Palette & Roles
- Typography Rules
- Spacing & Layout
- Component Styles
- Depth & Elevation
- Do's and Don'ts
- Responsive Behavior
- Agent Prompt Guide

## Tech stack

- [Puppeteer](https://pptr.dev/) — headless browser screenshots
- [Gemini 2.5 Flash](https://ai.google.dev/) — vision-based design analysis with structured output
- [Claude 4.x](https://docs.claude.com/) — Anthropic's vision models (Opus 4.7 default), structured output via tool use
- [Commander](https://github.com/tj/commander.js) — CLI framework
- [ora](https://github.com/sindresorhus/ora) — progress spinners

## License

MIT
