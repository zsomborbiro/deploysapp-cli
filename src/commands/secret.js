// src/commands/secret.js
import { makeClient } from "../config.js";
import { resolveServiceId, loadProject } from "../project.js";

export function resolveProjectId({ flag } = {}) {
  if (flag) return flag;
  const p = loadProject();
  if (p?.projectId) return p.projectId;
  const err = new Error("No project selected. Pass --project <id> or run `deploysapp link`.");
  err.exitCode = 2;
  throw err;
}

async function fetchSecrets(client, projectId) {
  const data = await client.get(`/projects/${encodeURIComponent(projectId)}/secrets`);
  return data.secrets || (Array.isArray(data) ? data : []);
}

export async function secretList({ project } = {}) {
  const client = makeClient();
  const projectId = resolveProjectId({ flag: project });
  const secrets = await fetchSecrets(client, projectId);
  if (!secrets.length) { console.log("No secrets."); return; }
  for (const s of secrets) console.log(`${s.name}  ${s.id}`);
}

export async function secretAttach({ project, service, name, as: envKey } = {}) {
  const client = makeClient();
  const projectId = resolveProjectId({ flag: project });
  const serviceId = resolveServiceId({ flag: service });
  const secrets = await fetchSecrets(client, projectId);
  const secret = secrets.find((s) => s.name === name || s.id === name);
  if (!secret) {
    const err = new Error(`No secret named or with id "${name}".`);
    err.exitCode = 2;
    throw err;
  }
  await client.post(`/services/${encodeURIComponent(serviceId)}/secret-refs`, {
    secretId: secret.id,
    envKey,
  });
  console.log(`✓ Attached secret "${secret.name}" as ${envKey}.`);
}
