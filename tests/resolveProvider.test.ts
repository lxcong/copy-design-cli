import { describe, it, expect } from "vitest";
import { resolveProvider } from "../src/providers/index.js";

describe("resolveProvider", () => {
  describe("model prefix inference", () => {
    it("claude-* model routes to anthropic", () => {
      const a = resolveProvider({ model: "claude-opus-4-7", env: { ANTHROPIC_API_KEY: "x" } });
      expect(a.provider).toBe("anthropic");
      expect(a.model).toBe("claude-opus-4-7");
    });

    it("gemini-* model routes to google", () => {
      const a = resolveProvider({ model: "gemini-2.5-flash", env: { GEMINI_API_KEY: "x" } });
      expect(a.provider).toBe("google");
      expect(a.model).toBe("gemini-2.5-flash");
    });

    it("unknown prefix throws", () => {
      expect(() => resolveProvider({ model: "foo-3", env: {} }))
        .toThrow(/Unrecognized model 'foo-3'/);
    });
  });

  describe("explicit --provider", () => {
    it("provider anthropic with no model uses claude-opus-4-7", () => {
      const a = resolveProvider({ provider: "anthropic", env: { ANTHROPIC_API_KEY: "x" } });
      expect(a.provider).toBe("anthropic");
      expect(a.model).toBe("claude-opus-4-7");
    });

    it("provider google with no model uses gemini-2.5-flash", () => {
      const a = resolveProvider({ provider: "google", env: { GEMINI_API_KEY: "x" } });
      expect(a.provider).toBe("google");
      expect(a.model).toBe("gemini-2.5-flash");
    });

    it("model and provider agreeing is ok", () => {
      const a = resolveProvider({
        model: "claude-sonnet-4-6",
        provider: "anthropic",
        env: { ANTHROPIC_API_KEY: "x" },
      });
      expect(a.model).toBe("claude-sonnet-4-6");
    });

    it("model and provider disagreeing throws", () => {
      expect(() =>
        resolveProvider({
          model: "claude-opus-4-7",
          provider: "google",
          env: { ANTHROPIC_API_KEY: "x", GEMINI_API_KEY: "x" },
        }),
      ).toThrow(/implies provider 'anthropic', but --provider 'google' was passed/);
    });
  });

  describe("env var fallback", () => {
    it("only ANTHROPIC_API_KEY set routes to anthropic", () => {
      const a = resolveProvider({ env: { ANTHROPIC_API_KEY: "x" } });
      expect(a.provider).toBe("anthropic");
    });

    it("only GEMINI_API_KEY set routes to google", () => {
      const a = resolveProvider({ env: { GEMINI_API_KEY: "x" } });
      expect(a.provider).toBe("google");
    });

    it("both keys set defaults to google (backward compatible)", () => {
      const a = resolveProvider({ env: { GEMINI_API_KEY: "x", ANTHROPIC_API_KEY: "y" } });
      expect(a.provider).toBe("google");
    });

    it("no flags and no keys throws", () => {
      expect(() => resolveProvider({ env: {} }))
        .toThrow(/No provider selected and no API key found/);
    });
  });

  describe("missing API key after resolution", () => {
    it("resolved anthropic without ANTHROPIC_API_KEY throws", () => {
      expect(() => resolveProvider({ provider: "anthropic", env: {} }))
        .toThrow(/Missing ANTHROPIC_API_KEY/);
    });

    it("resolved google without GEMINI_API_KEY throws", () => {
      expect(() => resolveProvider({ provider: "google", env: {} }))
        .toThrow(/Missing GEMINI_API_KEY/);
    });
  });
});
