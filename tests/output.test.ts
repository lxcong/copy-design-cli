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

describe("buildDesignMd", () => {
  it("includes all 9 sections", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, "https://example.com");
    expect(md).toContain("## Visual Theme & Atmosphere");
    expect(md).toContain("## Color Palette & Roles");
    expect(md).toContain("## Typography Rules");
    expect(md).toContain("## Spacing & Layout");
    expect(md).toContain("## Component Styles");
    expect(md).toContain("## Depth & Elevation");
    expect(md).toContain("## Do's and Don'ts");
    expect(md).toContain("## Responsive Behavior");
    expect(md).toContain("## Agent Prompt Guide");
  });

  it("includes actual color values", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, "https://example.com");
    expect(md).toContain("#1A73E8");
    expect(md).toContain("#34A853");
    expect(md).toContain("#FFFFFF");
  });

  it("includes typography details", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, "https://example.com");
    expect(md).toContain("Inter, sans-serif");
    expect(md).toContain("32px");
    expect(md).toContain("700");
  });

  it("includes source URL", () => {
    const md = buildDesignMd(MOCK_ANALYSIS, "https://example.com");
    expect(md).toContain("https://example.com");
  });
});
