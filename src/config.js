// src/config.js
import { homedir } from "os";
import { join } from "path";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "fs";
import { DeploysAppClient } from "./client.js";

function configHome() {
  return process.env.DEPLOYSAPP_CONFIG_HOME || join(homedir(), ".deploysapp");
}
function configPath() { return join(configHome(), "config.json"); }

export function saveConfig({ apiKey }) {
  mkdirSync(configHome(), { recursive: true });
  writeFileSync(configPath(), JSON.stringify({ apiKey }, null, 2), { mode: 0o600 });
}

export function loadConfig() {
  const fileKey = (() => {
    try { return JSON.parse(readFileSync(configPath(), "utf8")).apiKey || null; }
    catch { return null; }
  })();
  return {
    apiKey: process.env.DEPLOYSAPP_API_KEY || fileKey,
    apiUrl: process.env.DEPLOYSAPP_API_URL || "https://api.deploysapp.com",
  };
}

export function clearConfig() {
  if (existsSync(configPath())) rmSync(configPath());
}

export function makeClient() {
  const { apiKey, apiUrl } = loadConfig();
  if (!apiKey) {
    const err = new Error("Not logged in. Run `deploysapp login`.");
    err.exitCode = 1;
    throw err;
  }
  return new DeploysAppClient({ apiKey, baseUrl: apiUrl });
}
