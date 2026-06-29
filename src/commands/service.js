// src/commands/service.js
import { execFile } from "child_process";
import { makeClient } from "../config.js";
import { resolveServiceId } from "../project.js";

export function formatServicesTable(services) {
  if (!services?.length) return "No services found.";
  const rows = services.map((s) => [s.name || "", s.status || "", s.host || ""]);
  const widths = [0, 1, 2].map((c) => Math.max(...rows.map((r) => r[c].length), ["NAME", "STATUS", "HOST"][c].length));
  const fmt = (r) => r.map((v, c) => v.padEnd(widths[c])).join("  ");
  return [fmt(["NAME", "STATUS", "HOST"]), ...rows.map(fmt)].join("\n");
}

export async function ps() {
  const client = makeClient();
  const { services } = await client.get("/services");
  console.log(formatServicesTable(services));
}

async function lifecycle(action, service) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  await client.post(`/services/${encodeURIComponent(id)}/${action}`);
  console.log(`✓ ${action} requested for ${id}.`);
}
export const restart = ({ service } = {}) => lifecycle("restart", service);
export const stop = ({ service } = {}) => lifecycle("stop", service);
export const start = ({ service } = {}) => lifecycle("start", service);

export async function scale({ service, replicas } = {}) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  const n = Number(replicas);
  if (!Number.isInteger(n) || n < 1 || n > 10) { const e = new Error("--replicas must be 1-10."); e.exitCode = 2; throw e; }
  await client.patch(`/services/${encodeURIComponent(id)}/scale`, { replicas: n });
  console.log(`✓ Scaled ${id} to ${n} replica(s).`);
}

export async function open({ service } = {}) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  const { service: svc } = await client.get(`/services/${encodeURIComponent(id)}`);
  const url = svc?.host ? `https://${svc.host}` : null;
  if (!url) { const e = new Error("Service has no public host."); e.exitCode = 2; throw e; }
  console.log(url);
  if (process.platform === "darwin") return execFile("open", [url], () => {});
  if (process.platform === "win32") return execFile("cmd", ["/c", "start", "", url], () => {});
  return execFile("xdg-open", [url], () => {});
}
