// test/config.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "dsa-")); process.env.DEPLOYSAPP_CONFIG_HOME = dir; });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); delete process.env.DEPLOYSAPP_CONFIG_HOME; });

describe("config", () => {
  it("saves and loads an api key round-trip", async () => {
    const { saveConfig, loadConfig } = await import("../src/config.js?" + Math.random());
    saveConfig({ apiKey: "dsa_test123" });
    expect(loadConfig().apiKey).toBe("dsa_test123");
  });
  it("prefers DEPLOYSAPP_API_KEY env over the file", async () => {
    const { saveConfig, loadConfig } = await import("../src/config.js?" + Math.random());
    saveConfig({ apiKey: "dsa_fromfile" });
    process.env.DEPLOYSAPP_API_KEY = "dsa_fromenv";
    expect(loadConfig().apiKey).toBe("dsa_fromenv");
    delete process.env.DEPLOYSAPP_API_KEY;
  });
});
