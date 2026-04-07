import type { DesignAnalysis } from "./types.js";

export function buildDesignMd(
  analysis: DesignAnalysis,
  sourceUrl: string,
): string {
  const colorList = analysis.colors
    .map(c => `- **${c.name}** (${c.hex}): ${c.role}`)
    .join("\n");

  return `## Overview

${analysis.overview}

## Colors

${colorList}

## Typography

${analysis.typography}

## Elevation

${analysis.elevation}

## Components

${analysis.components}

## Do's and Don'ts

${analysis.dosAndDonts}
`;
}
