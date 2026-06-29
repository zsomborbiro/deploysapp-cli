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
});
