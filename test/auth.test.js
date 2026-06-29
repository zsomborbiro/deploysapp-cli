// test/auth.test.js
import { describe, it, expect, vi } from "vitest";
import { pollForToken } from "../src/commands/auth.js";

describe("pollForToken", () => {
  it("resolves when token becomes available", async () => {
    const responses = [
      { status: 400, body: { error: "authorization_pending" } },
      { status: 400, body: { error: "authorization_pending" } },
      { status: 200, body: { api_key: "dsa_ok" } },
    ];
    let i = 0;
    const fetchFn = vi.fn(async () => responses[i++]);
    const key = await pollForToken(fetchFn, { intervalMs: 1, maxMs: 1000 });
    expect(key).toBe("dsa_ok");
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
  it("throws on expired_token", async () => {
    const fetchFn = vi.fn(async () => ({ status: 400, body: { error: "expired_token" } }));
    await expect(pollForToken(fetchFn, { intervalMs: 1, maxMs: 1000 })).rejects.toThrow(/expired/);
  });
  it("survives a transient network error mid-poll and keeps polling", async () => {
    const steps = [
      async () => { throw new Error("fetch failed"); },          // transient blip
      async () => ({ status: 400, body: { error: "authorization_pending" } }),
      async () => ({ status: 200, body: { api_key: "dsa_recovered" } }),
    ];
    let i = 0;
    const fetchFn = vi.fn(() => steps[i++]());
    const key = await pollForToken(fetchFn, { intervalMs: 1, maxMs: 1000 });
    expect(key).toBe("dsa_recovered");
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
  it("times out (exit 3) if network errors persist past the deadline", async () => {
    const fetchFn = vi.fn(async () => { throw new Error("fetch failed"); });
    await expect(pollForToken(fetchFn, { intervalMs: 1, maxMs: 5 }))
      .rejects.toMatchObject({ exitCode: 3 });
  });
});
