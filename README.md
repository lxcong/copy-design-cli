# copy-design

Extract the design system from any webpage URL into a `DESIGN.md` + visual `preview.html`.

Powered by **Gemini** (AI vision analysis) + **Google Stitch** (UI recreation & code export).

## How it works

```
URL → Puppeteer screenshot → Gemini analyzes design → Stitch recreates UI → DESIGN.md + preview.html
```

1. Takes a full-page screenshot of the target URL
2. Gemini 2.5 Flash analyzes the screenshot and extracts design tokens (colors, typography, spacing, layout, components)
3. Stitch SDK recreates the design as a production-ready UI screen
4. Outputs a structured `DESIGN.md` (design tokens + HTML/CSS source code) and a visual `preview.html` (interactive design token catalog)

## Install

```bash
npm install -g copy-design
```

Or run directly:

```bash
npx copy-design https://example.com
```

## Setup

You need two API keys:

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export STITCH_API_KEY="your-stitch-api-key"
```

- **Gemini API key**: Get from [Google AI Studio](https://aistudio.google.com/apikey)
- **Stitch API key**: Get from [Stitch settings](https://stitch.withgoogle.com) (profile → API key)

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
```

### Output files

| File | Content |
|------|---------|
| `DESIGN.md` | Design tokens (colors, typography, spacing, layout, components) + Stitch-generated HTML/CSS source code |
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
- Source Code (full HTML/CSS)

## Tech stack

- [Puppeteer](https://pptr.dev/) — headless browser screenshots
- [Gemini 2.5 Flash](https://ai.google.dev/) — vision-based design analysis with structured output
- [Stitch SDK](https://github.com/google-labs-code/stitch-sdk) — UI screen generation & HTML export
- [Commander](https://github.com/tj/commander.js) — CLI framework
- [ora](https://github.com/sindresorhus/ora) — progress spinners

## License

MIT
