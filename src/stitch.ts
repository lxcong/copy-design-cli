import { Stitch, StitchToolClient } from "@google/stitch-sdk";
import type { DeviceType } from "./types.js";

export async function generateWithStitch(
  designPrompt: string,
  device: DeviceType,
  apiKey: string,
): Promise<string> {
  // Create a client with the explicit API key and a Stitch instance
  const client = new StitchToolClient({ apiKey });
  const stitchInstance = new Stitch(client);

  // Create a project for this extraction
  const project = await stitchInstance.createProject(
    `copy-design-${Date.now()}`,
  );

  // Generate screen from the design description
  const screen = await project.generate(designPrompt, device);

  // Get the HTML download URL and fetch the content
  const htmlUrl = await screen.getHtml();
  const response = await fetch(htmlUrl);
  const html = await response.text();

  return html;
}
