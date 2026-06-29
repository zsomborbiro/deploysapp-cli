// test/output.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printErr } from "../src/output.js";

describe("printErr exit-code mapping", () => {
  let originalExitCode;
  let consoleErrorSpy;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    consoleErrorSpy.mockRestore();
  });

  it("uses err.exitCode directly when set to 1", () => {
    const err = Object.assign(new Error("explicit exit 1"), { exitCode: 1 });
    printErr(err);
    expect(process.exitCode).toBe(1);
  });

  it("uses err.exitCode directly when set to 3", () => {
    const err = Object.assign(new Error("explicit exit 3"), { exitCode: 3 });
    printErr(err);
    expect(process.exitCode).toBe(3);
  });

  it("maps err.code === UNAUTHORIZED (no exitCode) to 1", () => {
    const err = Object.assign(new Error("not authorized"), { code: "UNAUTHORIZED" });
    printErr(err);
    expect(process.exitCode).toBe(1);
  });

  it("maps err.retryable === true (no exitCode/code) to 3", () => {
    const err = Object.assign(new Error("try again"), { retryable: true });
    printErr(err);
    expect(process.exitCode).toBe(3);
  });

  it("maps a plain Error (no exitCode, code, retryable) to 2", () => {
    const err = new Error("something went wrong");
    printErr(err);
    expect(process.exitCode).toBe(2);
  });

  it("exitCode takes precedence over code === UNAUTHORIZED", () => {
    const err = Object.assign(new Error("conflict"), { exitCode: 3, code: "UNAUTHORIZED" });
    printErr(err);
    expect(process.exitCode).toBe(3);
  });
});
