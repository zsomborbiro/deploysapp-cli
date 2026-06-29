// test/secret.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// vi.hoisted runs before module imports
const fakeClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(async () => ({})),
}));

vi.mock("../src/config.js", () => ({ makeClient: () => fakeClient }));
vi.mock("../src/project.js", () => ({
  resolveServiceId: () => "svc_test",
  loadProject: vi.fn(() => null),
}));

import { resolveProjectId, secretList, secretAttach } from "../src/commands/secret.js";
import { loadProject } from "../src/project.js";

let dir, cwd;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "dsa-secret-"));
  cwd = process.cwd();
  process.chdir(dir);
  vi.clearAllMocks();
});
afterEach(() => {
  process.chdir(cwd);
  rmSync(dir, { recursive: true, force: true });
});

describe("resolveProjectId", () => {
  it("prefers the flag", () => {
    expect(resolveProjectId({ flag: "proj_flag" })).toBe("proj_flag");
  });

  it("falls back to .deploysapp.json projectId", () => {
    loadProject.mockReturnValue({ projectId: "proj_file", serviceId: "svc_file" });
    expect(resolveProjectId({})).toBe("proj_file");
  });

  it("throws exitCode 2 when nothing is set", () => {
    loadProject.mockReturnValue(null);
    try { resolveProjectId({}); expect.unreachable(); }
    catch (e) { expect(e.exitCode).toBe(2); }
  });
});
