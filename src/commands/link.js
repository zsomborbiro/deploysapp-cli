import { createInterface } from "readline/promises";
import { makeClient } from "../config.js";
import { saveProject } from "../project.js";

export async function link({ service } = {}) {
  const client = makeClient();
  const { services } = await client.get("/services");
  if (!services?.length) { console.log("No services found. Create one in the dashboard first."); return; }

  let chosen;
  if (service) {
    chosen = services.find((s) => s.id === service);
    if (!chosen) { const e = new Error(`Service ${service} not found.`); e.exitCode = 2; throw e; }
  } else {
    services.forEach((s, i) => console.log(`  [${i + 1}] ${s.name}  (${s.id})  ${s.host || ""}`));
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question("Select a service: ");
    rl.close();
    chosen = services[Number(answer) - 1];
    if (!chosen) { const e = new Error("Invalid selection."); e.exitCode = 2; throw e; }
  }
  saveProject({ serviceId: chosen.id, projectId: chosen.projectId });
  console.log(`✓ Linked to ${chosen.name} (${chosen.id}). Wrote .deploysapp.json`);
}
