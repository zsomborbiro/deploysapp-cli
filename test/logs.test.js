import { describe, it, expect, vi } from "vitest";
import { tailRuntime } from "../src/commands/logs.js";

describe("tailRuntime (no follow)", () => {
  it("prints one page and stops", async () => {
    const client = { get: vi.fn(async () => ({ lines: ["a", "b"], ts: 100 })) };
    const printed = [];
    await tailRuntime(client, "svc1", { follow: false, tail: 50, onLine: (l) => printed.push(l) });
    expect(printed).toEqual(["a", "b"]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });
});
