import { describe, it, expect } from "vitest";
import { buildDesignMd } from "../src/output.js";
import type { DesignAnalysis } from "../src/types.js";

const MOCK: DesignAnalysis = {
  overview: "A calm, professional interface with high contrast and generous touch targets.",
  colors: [
    { name: "Primary", hex: "#2665fd", role: "CTAs, active states, key interactive elements" },
    { name: "Secondary", hex: "#6074b9", role: "Supporting actions, chips, toggle states" },
    { name: "Neutral", hex: "#757681", role: "Backgrounds, surfaces, non-chromatic UI" },
  ],
  typography: "Headline Font: Inter. Body Font: Inter. Headlines use semi-bold weight. Body text uses regular weight at 14-16px.",
  elevation: "This design uses no shadows. Depth is conveyed through border contrast and surface color variation.",
  components: "- **Buttons**: Rounded (8px), primary uses brand blue fill, secondary uses outline\n- **Inputs**: 1px border, surface-variant background, 12px padding\n- **Cards**: No elevation, 1px outline border, 12px corner radius",
  dosAndDonts: "- Do use primary color only for the most important action per screen\n- Don't mix rounded and sharp corners in the same view",
};

describe("buildDesignMd", () => {
  it("includes all 6 sections", () => {
    const md = buildDesignMd(MOCK, "https://example.com");
    expect(md).toContain("## Overview");
    expect(md).toContain("## Colors");
    expect(md).toContain("## Typography");
    expect(md).toContain("## Elevation");
    expect(md).toContain("## Components");
    expect(md).toContain("## Do's and Don'ts");
  });

  it("formats colors as name + hex + role", () => {
    const md = buildDesignMd(MOCK, "https://example.com");
    expect(md).toContain("**Primary** (#2665fd): CTAs, active states");
    expect(md).toContain("**Secondary** (#6074b9)");
  });

  it("includes overview text", () => {
    const md = buildDesignMd(MOCK, "https://example.com");
    expect(md).toContain("calm, professional interface");
  });

  it("does not include source URL in body", () => {
    const md = buildDesignMd(MOCK, "https://example.com");
    expect(md).not.toContain("https://example.com");
  });
});
