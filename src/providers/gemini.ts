import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import type { DesignAnalysis } from "../types.js";
import type { DesignAnalyzer } from "./types.js";
import { PROMPT } from "./prompt.js";

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overview: {
      type: SchemaType.STRING,
      description: "A holistic description of the design's look and feel. Describe the personality: playful or professional? Dense or spacious? Warm or cold? What emotion does it convey? 2-4 sentences.",
    },
    colors: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Role name: Primary, Secondary, Tertiary, Neutral, or a descriptive functional name" },
          hex: { type: SchemaType.STRING, description: "6-digit hex like #2665fd" },
          role: { type: SchemaType.STRING, description: "What the agent should use this color for, e.g. 'CTAs, active states, key interactive elements'" },
        },
        required: ["name", "hex", "role"],
      },
      description: "Primary, secondary, tertiary, and neutral palettes. Include 4-8 key colors.",
    },
    typography: {
      type: SchemaType.STRING,
      description: "Describe font families and their roles. Format like: 'Headline Font: Inter, Body Font: Inter'. Then describe weight usage for headlines vs body, typical sizes (e.g. 14-16px for body, 12px for labels), and any special treatments. 2-4 sentences.",
    },
    elevation: {
      type: SchemaType.STRING,
      description: "How the design conveys depth. Does it use shadows? If so, describe their quality (soft, harsh, none). Or is depth conveyed through borders and surface color variation? 1-3 sentences.",
    },
    components: {
      type: SchemaType.STRING,
      description: "Style guidance for key components. Cover: Buttons (variants, corner radius, fill style), Inputs (border, background, padding), Cards (elevation, border, corner radius). Use format like '- **Buttons**: Rounded (8px), primary uses brand fill, secondary uses outline'. One bullet per component type.",
    },
    dosAndDonts: {
      type: SchemaType.STRING,
      description: "4-6 practical guidelines as bullet points. Mix do's and don'ts. Format: '- Do use primary color only for the most important action per screen\\n- Don't mix rounded and sharp corners'. Focus on maintaining consistency.",
    },
    preview: {
      type: SchemaType.OBJECT,
      description: "Structured values for rendering a visual preview. Extract exact CSS values.",
      properties: {
        fontFamily: { type: SchemaType.STRING, description: "CSS font-family value like 'Inter, sans-serif'" },
        headingSizes: {
          type: SchemaType.OBJECT,
          properties: {
            h1: { type: SchemaType.STRING, description: "H1 size like 48px" },
            h2: { type: SchemaType.STRING, description: "H2 size like 32px" },
            h3: { type: SchemaType.STRING, description: "H3 size like 24px" },
          },
          required: ["h1", "h2", "h3"],
        },
        headingWeight: { type: SchemaType.NUMBER, description: "Heading font weight like 700" },
        bodySize: { type: SchemaType.STRING, description: "Body text size like 16px" },
        buttonRadius: { type: SchemaType.STRING, description: "Button border-radius like 8px" },
        cardRadius: { type: SchemaType.STRING, description: "Card border-radius like 12px" },
        cardShadow: { type: SchemaType.STRING, description: "Card box-shadow CSS value, or 'none'" },
      },
      required: ["fontFamily", "headingSizes", "headingWeight", "bodySize", "buttonRadius", "cardRadius", "cardShadow"],
    },
  },
  required: ["overview", "colors", "typography", "elevation", "components", "dosAndDonts", "preview"],
};

export function createGeminiAnalyzer(apiKey: string, model: string): DesignAnalyzer {
  return {
    provider: "google",
    model,
    async analyze(screenshotPath: string): Promise<DesignAnalysis> {
      const genAI = new GoogleGenerativeAI(apiKey);
      const client = genAI.getGenerativeModel({
        model,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        } as Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"],
      });

      const imageBuffer = await readFile(screenshotPath);
      const base64Image = imageBuffer.toString("base64");

      const result = await client.generateContent([
        PROMPT,
        { inlineData: { mimeType: "image/png", data: base64Image } },
      ]);

      return JSON.parse(result.response.text().trim()) as DesignAnalysis;
    },
  };
}
