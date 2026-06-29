// test/env.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted runs before module imports, making fakeClient available to vi.mock factories
const fakeClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(async () => ({})),
  patch: vi.fn(async () => ({})),
  delete: vi.fn(async () => ({})),
}));

vi.mock("../src/config.js", () => ({ makeClient: () => fakeClient }));
vi.mock("../src/project.js", () => ({ resolveServiceId: () => "svc_test" }));

import { parseKeyValue, envSet, envRm } from "../src/commands/env.js";

describe("parseKeyValue", () => {
  it("splits on the first =", () => {
    expect(parseKeyValue("URL=https://a.com/?x=1")).toEqual({ key: "URL", value: "https://a.com/?x=1" });
  });
  it("rejects input with no =", () => {
    try { parseKeyValue("NOPE"); expect.unreachable(); } catch (e) { expect(e.exitCode).toBe(2); }
  });
  it("rejects empty key", () => {
    try { parseKeyValue("=v"); expect.unreachable(); } catch (e) { expect(e.exitCode).toBe(2); }
  });
});

describe("envSet", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("creates a new var via POST when key is absent", async () => {
    fakeClient.get.mockResolvedValue({ env: [] });
    fakeClient.post.mockResolvedValue({});
    await envSet({ pair: "FOO=bar" });
    expect(fakeClient.post).toHaveBeenCalledWith(
      expect.stringContaining("/services/svc_test/env"),
      { key: "FOO", value: "bar" }
    );
    expect(fakeClient.patch).not.toHaveBeenCalled();
  });

  it("updates existing var via PATCH when key is present", async () => {
    fakeClient.get.mockResolvedValue({ env: [{ id: "e1", key: "FOO", value: "old" }] });
    fakeClient.patch.mockResolvedValue({});
    await envSet({ pair: "FOO=new" });
    expect(fakeClient.patch).toHaveBeenCalledWith(
      expect.stringContaining("/env/e1"),
      { key: "FOO", value: "new" }
    );
    expect(fakeClient.post).not.toHaveBeenCalled();
  });

  it("appends ?restart=true to POST path when --restart flag is set", async () => {
    fakeClient.get.mockResolvedValue({ env: [] });
    fakeClient.post.mockResolvedValue({});
    await envSet({ pair: "A=b", restart: true });
    expect(fakeClient.post).toHaveBeenCalledWith(
      expect.stringContaining("restart=true"),
      { key: "A", value: "b" }
    );
  });
});

describe("envRm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("throws an error with exitCode 2 when key is not found", async () => {
    fakeClient.get.mockResolvedValue({ env: [] });
    await expect(envRm({ key: "NOPE" })).rejects.toMatchObject({ exitCode: 2 });
  });
});
