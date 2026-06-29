// src/commands/auth.js
import { execFile } from "child_process";
import { makeClient, saveConfig, clearConfig, loadConfig } from "../config.js";

export async function whoami() {
  const client = makeClient();
  const me = await client.get("/me");
  const email = me?.user?.email || me?.email || "(unknown)";
  console.log(email);
}

const API_URL = () => loadConfig().apiUrl;

export function pollForToken(fetchFn, { intervalMs = 5000, maxMs = 600000 } = {}) {
  const deadline = Date.now() + maxMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      let r;
      try { r = await fetchFn(); } catch (e) { return reject(e); }
      if (r.status === 200 && r.body?.api_key) return resolve(r.body.api_key);
      const err = r.body?.error;
      if (err === "authorization_pending") {
        if (Date.now() > deadline) return reject(new Error("Login timed out."));
        return setTimeout(tick, intervalMs);
      }
      if (err === "expired_token") return reject(new Error("Code expired — run `deploysapp login` again."));
      if (err === "access_denied") return reject(new Error("Login was denied."));
      return reject(new Error(err || "Login failed."));
    };
    tick();
  });
}

function openBrowser(url) {
  if (process.platform === "darwin") return execFile("open", [url], () => {});
  if (process.platform === "win32") return execFile("cmd", ["/c", "start", "", url], () => {});
  return execFile("xdg-open", [url], () => {});
}

export async function login({ open = true } = {}) {
  const base = API_URL();
  const startRes = await fetch(`${base}/cli/device/code`, { method: "POST" });
  if (!startRes.ok) {
    const err = new Error(`Could not start login (server returned ${startRes.status}). Try again later.`);
    err.exitCode = 3;
    throw err;
  }
  const start = await startRes.json();
  console.log(`\n  To authorize this device, visit:\n    ${start.verification_uri}\n  and enter the code:\n\n    ${start.user_code}\n`);
  if (open) openBrowser(start.verification_uri);

  const apiKey = await pollForToken(
    async () => {
      const res = await fetch(`${base}/cli/device/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_code: start.device_code }),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    },
    { intervalMs: (start.interval || 5) * 1000, maxMs: (start.expires_in || 600) * 1000 }
  );

  saveConfig({ apiKey });
  console.log("✓ Logged in.");
}

export async function logout() {
  clearConfig();
  console.log("✓ Logged out.");
}
