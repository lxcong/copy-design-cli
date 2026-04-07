import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import type { DesignAnalysis } from "./types.js";

const PROMPT = `You are an expert UI/UX designer. Analyze this webpage screenshot and extract its design system.

Return ONLY a valid JSON object with this exact structure (no markdown fencing, no explanation):

{
  "theme": "Light/Dark, brief style description (e.g. 'Dark, minimal SaaS with neon accents')",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "textPrimary": "#hex",
    "textSecondary": "#hex",
    "error": "#hex (estimate if not visible)",
    "success": "#hex (estimate if not visible)"
  },
  "typography": {
    "fontFamily": "detected font family with fallback",
    "h1": { "size": "px value", "weight": number },
    "h2": { "size": "px value", "weight": number },
    "h3": { "size": "px value", "weight": number },
    "body": { "size": "px value", "weight": number },
    "caption": { "size": "px value", "weight": number }
  },
  "spacing": {
    "baseUnit": "px value",
    "values": [array of common spacing values in px]
  },
  "layout": {
    "description": "Page structure: navigation, content areas, sidebar, footer",
    "maxWidth": "px value",
    "columns": number
  },
  "components": {
    "buttonRadius": "px value",
    "cardRadius": "px value",
    "cardShadow": "CSS shadow value",
    "inputBorder": "CSS border value"
  },
  "designPrompt": "A detailed 2-3 sentence description suitable for Stitch to recreate this design. Include: layout structure, color scheme, typography style, component shapes, and overall aesthetic. Be specific about visual details."
}

Be precise with hex color values. Estimate sizes based on visual proportions.`;

export async function analyzeScreenshot(
  screenshotPath: string,
  apiKey: string,
): Promise<DesignAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imageBuffer = await readFile(screenshotPath);
  const base64Image = imageBuffer.toString("base64");

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text().trim();
  // Strip markdown code fences if model includes them despite instructions
  const cleaned = text.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "");
  return JSON.parse(cleaned) as DesignAnalysis;
}
