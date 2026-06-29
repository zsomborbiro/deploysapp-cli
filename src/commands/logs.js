// src/commands/logs.js
import { makeClient } from "../config.js";
import { resolveServiceId } from "../project.js";
import { streamBuild } from "./deploy.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function tailRuntime(client, serviceId, { follow = false, tail = 200, sleep = (ms) => wait(ms), onLine = (l) => console.log(l) } = {}) {
  let since = 0;
  const first = await client.get(`/services/${encodeURIComponent(serviceId)}/logs?tail=${tail}`);
  for (const l of first.lines || []) onLine(l);
  since = first.ts ?? since;
  if (!follow) return;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(2000);
    const page = await client.get(`/services/${encodeURIComponent(serviceId)}/logs?since=${since}`);
    for (const l of page.lines || []) onLine(l);
    since = page.ts ?? since;
  }
}

export async function logs({ service, follow, build, runtime, tail } = {}) {
  const client = makeClient();
  const serviceId = resolveServiceId({ flag: service });
  const wantBuild = build && !runtime;
  if (wantBuild) {
    const { builds } = await client.get(`/services/${encodeURIComponent(serviceId)}/builds`);
    if (!builds?.length) { console.log("No builds yet."); return; }
    await streamBuild(client, builds[0].id);
    return;
  }
  await tailRuntime(client, serviceId, { follow: !!follow, tail: Number(tail) || 200 });
}
