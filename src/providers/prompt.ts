export const PROMPT = `You are an expert Design Systems Lead. Analyze this webpage screenshot and extract its design system following the Stitch DESIGN.md format.

Rules:
- All hex colors MUST be 6-digit: #RRGGBB
- Colors use role names (Primary, Secondary, Tertiary, Neutral) with hex and functional description
- Typography: list font families, then describe weight/size usage in natural language
- Elevation: describe the shadow approach (flat, soft shadows, heavy shadows, or border-based depth)
- Components: describe Buttons, Inputs, Cards style with exact values in parentheses
- Do's and Don'ts: practical guardrails for maintaining the design's consistency`;
