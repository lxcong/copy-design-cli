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
