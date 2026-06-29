// src/commands/env.js
import { makeClient } from "../config.js";
import { resolveServiceId } from "../project.js";

export function parseKeyValue(pair) {
  const idx = (pair || "").indexOf("=");
  if (idx <= 0) { const e = new Error("Expected KEY=VALUE."); e.exitCode = 2; throw e; }
  return { key: pair.slice(0, idx), value: pair.slice(idx + 1) };
}

async function fetchEnv(client, id) {
  const data = await client.get(`/services/${encodeURIComponent(id)}/env`);
  return data.env || data.envVars || (Array.isArray(data) ? data : []);
}

export async function envList({ service } = {}) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  const env = await fetchEnv(client, id);
  if (!env.length) { console.log("No env vars set."); return; }
  for (const e of env) console.log(`${e.key}=${e.value}`);
}

export async function envGet({ service, key } = {}) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  const env = await fetchEnv(client, id);
  const hit = env.find((e) => e.key === key);
  if (!hit) { const e = new Error(`No env var named ${key}.`); e.exitCode = 2; throw e; }
  console.log(hit.value);
}

export async function envSet({ service, pair, restart } = {}) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  const { key, value } = parseKeyValue(pair);
  const env = await fetchEnv(client, id);
  const existing = env.find((e) => e.key === key);
  const q = restart ? "?restart=true" : "";
  if (existing) await client.patch(`/services/${encodeURIComponent(id)}/env/${existing.id}${q}`, { key, value });
  else await client.post(`/services/${encodeURIComponent(id)}/env${q}`, { key, value });
  console.log(`✓ Set ${key}${restart ? " (restarted)" : ""}.`);
}

export async function envRm({ service, key, restart } = {}) {
  const client = makeClient();
  const id = resolveServiceId({ flag: service });
  const env = await fetchEnv(client, id);
  const existing = env.find((e) => e.key === key);
  if (!existing) { const e = new Error(`No env var named ${key}.`); e.exitCode = 2; throw e; }
  const q = restart ? "?restart=true" : "";
  await client.delete(`/services/${encodeURIComponent(id)}/env/${existing.id}${q}`);
  console.log(`✓ Removed ${key}.`);
}
