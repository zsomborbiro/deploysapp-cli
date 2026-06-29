// test/env.test.js
import { describe, it, expect } from "vitest";
import { parseKeyValue } from "../src/commands/env.js";

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
