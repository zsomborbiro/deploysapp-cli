import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

const FILE = ".deploysapp.json";
function path() { return join(process.cwd(), FILE); }

export function saveProject({ serviceId, projectId }) {
  writeFileSync(path(), JSON.stringify({ serviceId, projectId }, null, 2));
}
export function loadProject() {
  try { return JSON.parse(readFileSync(path(), "utf8")); } catch { return null; }
}
export function resolveServiceId({ flag } = {}) {
  if (flag) return flag;
  const p = loadProject();
  if (p?.serviceId) return p.serviceId;
  const err = new Error("No service selected. Pass --service <id> or run `deploysapp link`.");
  err.exitCode = 2;
  throw err;
}
