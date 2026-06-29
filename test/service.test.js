// test/service.test.js
import { describe, it, expect } from "vitest";
import { formatServicesTable } from "../src/commands/service.js";

describe("formatServicesTable", () => {
  it("renders name, status, host columns", () => {
    const out = formatServicesTable([
      { name: "api", status: "running", host: "api.example.com" },
      { name: "web", status: "stopped", host: "web.example.com" },
    ]);
    expect(out).toMatch(/api\s+running\s+api\.example\.com/);
    expect(out).toMatch(/web\s+stopped\s+web\.example\.com/);
  });
  it("handles an empty list", () => {
    expect(formatServicesTable([])).toMatch(/No services/);
  });
});
