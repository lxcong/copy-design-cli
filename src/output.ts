import type { DesignAnalysis } from "./types.js";

function ensurePx(v: number | string): string {
  const n = typeof v === "number" ? v : parseFloat(String(v)) || 0;
  return `${n}px`;
}

export function buildDesignMd(
  analysis: DesignAnalysis,
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
- **Scale:** ${spacing.values.map(v => ensurePx(v)).join(", ")}
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
`;
}
