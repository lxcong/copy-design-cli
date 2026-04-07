import { program } from "commander";
import ora from "ora";
import { unlink, writeFile } from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./analyze.js";
import { generateWithStitch } from "./stitch.js";
import { buildDesignMd } from "./output.js";
import type { DeviceType } from "./types.js";

program
  .name("copy-design")
  .description("Extract design system from any webpage URL into DESIGN.md")
  .argument("<url>", "Webpage URL to analyze")
  .option("-o, --output <path>", "Output file path", "./DESIGN.md")
  .option("-d, --device <type>", "Device type: DESKTOP, MOBILE, TABLET", "DESKTOP")
  .action(async (url: string, opts: { output: string; device: string }) => {
    const device = opts.device.toUpperCase() as DeviceType;
    if (!["DESKTOP", "MOBILE", "TABLET"].includes(device)) {
      console.error(`Invalid device type: ${opts.device}. Use DESKTOP, MOBILE, or TABLET.`);
      process.exit(1);
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("Missing GEMINI_API_KEY environment variable.");
      process.exit(1);
    }
    const stitchKey = process.env.STITCH_API_KEY;
    if (!stitchKey) {
      console.error("Missing STITCH_API_KEY environment variable.");
      process.exit(1);
    }

    let screenshotPath: string | undefined;

    try {
      // Step 1: Screenshot
      const spinner1 = ora("Taking screenshot...").start();
      screenshotPath = await takeScreenshot(url, device);
      spinner1.succeed("Screenshot captured");

      // Step 2: Analyze
      const spinner2 = ora("Analyzing design with Gemini...").start();
      const analysis = await analyzeScreenshot(screenshotPath, geminiKey);
      spinner2.succeed("Design analysis complete");

      // Step 3: Stitch
      const spinner3 = ora("Generating with Stitch...").start();
      const html = await generateWithStitch(analysis.designPrompt, device, stitchKey);
      spinner3.succeed("Stitch generation complete");

      // Step 4: Output
      const spinner4 = ora("Writing DESIGN.md...").start();
      const markdown = buildDesignMd(analysis, html, url);
      await writeFile(opts.output, markdown, "utf-8");
      spinner4.succeed(`DESIGN.md saved to ${opts.output}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}`);
      process.exit(1);
    } finally {
      if (screenshotPath) {
        await unlink(screenshotPath).catch(() => {});
      }
    }
  });

program.parse();
