import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let dir, cwd;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "dsa-proj-")); cwd = process.cwd(); process.chdir(dir); });
afterEach(() => { process.chdir(cwd); rmSync(dir, { recursive: true, force: true }); });

describe("resolveServiceId", () => {
  it("prefers the flag", async () => {
    const { resolveServiceId } = await import("../src/project.js?" + Math.random());
    expect(resolveServiceId({ flag: "svc_flag" })).toBe("svc_flag");
  });
  it("falls back to .deploysapp.json", async () => {
    const m = await import("../src/project.js?" + Math.random());
    m.saveProject({ serviceId: "svc_file", projectId: "p1" });
    expect(m.resolveServiceId({})).toBe("svc_file");
  });
  it("throws exitCode 2 when nothing is set", async () => {
    const { resolveServiceId } = await import("../src/project.js?" + Math.random());
    try { resolveServiceId({}); expect.unreachable(); }
    catch (e) { expect(e.exitCode).toBe(2); }
  });
});
