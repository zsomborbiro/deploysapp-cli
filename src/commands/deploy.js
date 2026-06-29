// src/commands/deploy.js
import { makeClient } from "../config.js";
import { resolveServiceId } from "../project.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function streamBuild(client, buildId, { sleep = (ms) => wait(ms), onLine = (l) => console.log(l) } = {}) {
  let cursor = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await client.get(`/builds/${encodeURIComponent(buildId)}/logs?since=${cursor}`);
    for (const line of page.lines || []) onLine(line);
    if (typeof page.nextCursor === "number") cursor = page.nextCursor;
    if (page.done) return page.build?.status || "unknown";
    await sleep(2000);
  }
}

export async function deploy({ service } = {}) {
  const client = makeClient();
  const serviceId = resolveServiceId({ flag: service });
  const { build } = await client.post(`/services/${encodeURIComponent(serviceId)}/redeploy`);
  console.log(`Build ${build.id} queued. Streaming logs…\n`);
  const status = await streamBuild(client, build.id);
  if (status === "success") { console.log("\n✓ Deploy succeeded."); }
  else { console.error(`\n✗ Deploy ${status}.`); process.exitCode = 1; }
}
