// test/deploy.test.js
import { describe, it, expect, vi } from "vitest";
import { streamBuild } from "../src/commands/deploy.js";

describe("streamBuild", () => {
  it("prints incremental lines and returns final status", async () => {
    const pages = [
      { build: { status: "building" }, lines: ["step 1"], nextCursor: 1, done: false },
      { build: { status: "building" }, lines: ["step 2"], nextCursor: 2, done: false },
      { build: { status: "success" }, lines: ["done"], nextCursor: 3, done: true },
    ];
    let i = 0;
    const client = { get: vi.fn(async () => pages[i++]) };
    const printed = [];
    const status = await streamBuild(client, "b1", { sleep: async () => {}, onLine: (l) => printed.push(l) });
    expect(printed).toEqual(["step 1", "step 2", "done"]);
    expect(status).toBe("success");
  });

  it("returns 'timeout' and does not hang when the server never signals done", async () => {
    const client = { get: vi.fn(async () => ({ build: { status: "building" }, lines: [], nextCursor: 0, done: false })) };
    const printed = [];
    let nowCalls = 0;
    // First call returns 0 (sets deadline = 0 + 1000 = 1000); subsequent calls return a value past the deadline
    const now = () => (nowCalls++ === 0 ? 0 : 2000);
    const status = await streamBuild(client, "b2", {
      sleep: async () => {},
      onLine: (l) => printed.push(l),
      maxMs: 1000,
      now,
    });
    expect(status).toBe("timeout");
    expect(printed).toContain("[deploy] Stopped tailing after timeout; the build may still be running. Check the dashboard.");
  });
});
