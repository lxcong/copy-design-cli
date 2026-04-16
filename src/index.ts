import { program } from "commander";
import ora from "ora";
import { unlink, writeFile } from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { resolveProvider } from "./providers/index.js";
import type { ProviderName } from "./providers/types.js";
import { buildDesignMd } from "./output.js";
import { buildPreviewHtml } from "./preview.js";
import type { DeviceType } from "./types.js";

program
  .name("copy-design")
  .description("Extract design system from any webpage URL into DESIGN.md")
  .argument("<url>", "Webpage URL to analyze")
  .option("-o, --output <path>", "Output file path", "./DESIGN.md")
  .option("-d, --device <type>", "Device type: DESKTOP, MOBILE, TABLET", "DESKTOP")
  .option("-m, --model <name>", "Model name, e.g. claude-opus-4-7 or gemini-2.5-flash")
  .option("-p, --provider <name>", "Provider: google or anthropic")
  .action(
    async (
      url: string,
      opts: {
        output: string;
        device: string;
        model?: string;
        provider?: string;
      },
    ) => {
      const device = opts.device.toUpperCase() as DeviceType;
      if (!["DESKTOP", "MOBILE", "TABLET"].includes(device)) {
        console.error(`Invalid device type: ${opts.device}. Use DESKTOP, MOBILE, or TABLET.`);
        process.exit(1);
      }

      let provider: ProviderName | undefined;
      if (opts.provider) {
        const normalized = opts.provider.toLowerCase();
        if (normalized !== "google" && normalized !== "anthropic") {
          console.error(`Invalid provider: ${opts.provider}. Use google or anthropic.`);
          process.exit(1);
        }
        provider = normalized;
      }

      let analyzer;
      try {
        analyzer = resolveProvider({
          model: opts.model,
          provider,
          env: process.env,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(message);
        process.exit(1);
      }

      let screenshotPath: string | undefined;

      try {
        const spinner1 = ora("Taking screenshot...").start();
        screenshotPath = await takeScreenshot(url, device);
        spinner1.succeed("Screenshot captured");

        const spinner2 = ora(
          `Analyzing design with ${analyzer.provider} (${analyzer.model})...`,
        ).start();
        const analysis = await analyzer.analyze(screenshotPath);
        spinner2.succeed("Design analysis complete");

        const spinner3 = ora("Writing DESIGN.md + preview.html...").start();
        const markdown = buildDesignMd(analysis, url);
        const preview = buildPreviewHtml(analysis, url);
        const previewPath = opts.output.replace(/\.md$/i, "-preview.html");
        await writeFile(opts.output, markdown, "utf-8");
        await writeFile(previewPath, preview, "utf-8");
        spinner3.succeed(`DESIGN.md saved to ${opts.output}`);
        console.log(`  Preview: ${previewPath}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nError: ${message}`);
        process.exit(1);
      } finally {
        if (screenshotPath) {
          await unlink(screenshotPath).catch(() => {});
        }
      }
    },
  );

program.parse();
