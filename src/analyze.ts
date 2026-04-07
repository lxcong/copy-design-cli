import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import type { DesignAnalysis } from "./types.js";

// Gemini response schema — forces structured JSON output
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    theme: { type: SchemaType.STRING, description: "Light or Dark, plus a brief style description, e.g. 'Dark, minimal SaaS with vibrant gradient accents'" },
    colors: {
      type: SchemaType.OBJECT,
      properties: {
        primary:       { type: SchemaType.STRING, description: "6-digit hex like #635BFF" },
        secondary:     { type: SchemaType.STRING, description: "6-digit hex" },
        accent:        { type: SchemaType.STRING, description: "6-digit hex" },
        background:    { type: SchemaType.STRING, description: "6-digit hex" },
        surface:       { type: SchemaType.STRING, description: "6-digit hex" },
        textPrimary:   { type: SchemaType.STRING, description: "6-digit hex" },
        textSecondary: { type: SchemaType.STRING, description: "6-digit hex" },
        error:         { type: SchemaType.STRING, description: "6-digit hex, estimate if not visible" },
        success:       { type: SchemaType.STRING, description: "6-digit hex, estimate if not visible" },
      },
      required: ["primary","secondary","accent","background","surface","textPrimary","textSecondary","error","success"],
    },
    typography: {
      type: SchemaType.OBJECT,
      properties: {
        fontFamily: { type: SchemaType.STRING, description: "CSS font-family value with fallbacks, e.g. 'Inter, sans-serif'" },
        h1:      { type: SchemaType.OBJECT, properties: { size: { type: SchemaType.STRING, description: "px value like 48px" }, weight: { type: SchemaType.NUMBER } }, required: ["size","weight"] },
        h2:      { type: SchemaType.OBJECT, properties: { size: { type: SchemaType.STRING, description: "px value like 32px" }, weight: { type: SchemaType.NUMBER } }, required: ["size","weight"] },
        h3:      { type: SchemaType.OBJECT, properties: { size: { type: SchemaType.STRING, description: "px value like 24px" }, weight: { type: SchemaType.NUMBER } }, required: ["size","weight"] },
        body:    { type: SchemaType.OBJECT, properties: { size: { type: SchemaType.STRING, description: "px value like 16px" }, weight: { type: SchemaType.NUMBER } }, required: ["size","weight"] },
        caption: { type: SchemaType.OBJECT, properties: { size: { type: SchemaType.STRING, description: "px value like 12px" }, weight: { type: SchemaType.NUMBER } }, required: ["size","weight"] },
      },
      required: ["fontFamily","h1","h2","h3","body","caption"],
    },
    spacing: {
      type: SchemaType.OBJECT,
      properties: {
        baseUnit: { type: SchemaType.STRING, description: "Base spacing unit like 8px" },
        values:   { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER }, description: "Common spacing values as plain numbers without px suffix, e.g. [4, 8, 16, 24, 32]" },
      },
      required: ["baseUnit","values"],
    },
    layout: {
      type: SchemaType.OBJECT,
      properties: {
        description: { type: SchemaType.STRING, description: "Page structure description" },
        maxWidth:    { type: SchemaType.STRING, description: "Max container width like 1200px" },
        columns:     { type: SchemaType.NUMBER },
      },
      required: ["description","maxWidth","columns"],
    },
    components: {
      type: SchemaType.OBJECT,
      properties: {
        buttonRadius: { type: SchemaType.STRING, description: "CSS border-radius like 8px" },
        cardRadius:   { type: SchemaType.STRING, description: "CSS border-radius like 12px" },
        cardShadow:   { type: SchemaType.STRING, description: "CSS box-shadow value like 0 1px 3px rgba(0,0,0,0.12)" },
        inputBorder:  { type: SchemaType.STRING, description: "CSS border value like 1px solid #DADCE0" },
      },
      required: ["buttonRadius","cardRadius","cardShadow","inputBorder"],
    },
    designPrompt: { type: SchemaType.STRING, description: "A detailed 2-3 sentence description suitable for Stitch to recreate this design. Include layout structure, color scheme, typography style, component shapes, and overall aesthetic." },
  },
  required: ["theme","colors","typography","spacing","layout","components","designPrompt"],
};

const PROMPT = `You are an expert UI/UX designer. Analyze this webpage screenshot and extract its complete design system.

Rules:
- All colors MUST be 6-digit hex format: #RRGGBB (never rgb(), hsl(), or 3-digit hex)
- All font sizes MUST include "px" suffix: "48px" not "48" or "3rem"
- spacing.values MUST be plain numbers without units: [4, 8, 16] not ["4px", "8px"]
- Font weight MUST be a number: 400, 500, 600, 700
- If a value is not visible in the screenshot, make a reasonable estimate based on the overall style
- Be precise with hex color values — sample from the actual pixels you see`;

export async function analyzeScreenshot(
  screenshotPath: string,
  apiKey: string,
): Promise<DesignAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    } as Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"],
  });

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
  return JSON.parse(text) as DesignAnalysis;
}
