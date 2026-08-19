import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const PKG_ROOT = join(__dirname, "..");

describe("@nself/tailwind-brand", () => {
  it("(a) exports color tokens from src/index.ts", async () => {
    const mod = await import("../src/index.js");
    expect(mod.nSelfPalette).toBeDefined();
    expect(typeof mod.nSelfPalette).toBe("object");
    // Verify known brand color keys are present
    expect(mod.nSelfPalette).toHaveProperty("bgBody");
    expect(mod.nSelfPalette).toHaveProperty("accentFrom");
    expect(mod.PAGE_BG_DARK).toBe("#0B0B14");
    expect(mod.statusTones).toBeDefined();
    expect(mod.pillTones).toBeDefined();
  });

  it("(b) css-vars.css contains --brand-primary token", () => {
    const cssPath = join(PKG_ROOT, "src", "css-vars.css");
    const contents = readFileSync(cssPath, "utf8");
    // File uses --color-brand-primary (the canonical brand primary CSS var)
    expect(contents).toContain("--color-brand-primary");
  });

  it("(c) stylelint plugin loads without error", async () => {
    const plugin = // The stylelint plugin is plain JS with no declarations; this test only
    // asserts it loads, so the shape is deliberately untyped here.
    await import("../stylelint-plugin/index.js" as string);
    const pluginExport = plugin.default ?? plugin;
    expect(pluginExport).toBeDefined();
  });
});
