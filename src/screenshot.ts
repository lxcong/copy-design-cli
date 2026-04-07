import puppeteer from "puppeteer";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import type { DeviceType } from "./types.js";
import { VIEWPORTS } from "./types.js";

export async function takeScreenshot(
  url: string,
  device: DeviceType,
): Promise<string> {
  const viewport = VIEWPORTS[device];
  const outputPath = join(tmpdir(), `copy-design-${randomUUID()}.png`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    }

    await page.screenshot({ path: outputPath, fullPage: true });
    return outputPath;
  } finally {
    await browser.close();
  }
}
