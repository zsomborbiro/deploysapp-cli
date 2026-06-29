// src/output.js
export function printJson(obj) { console.log(JSON.stringify(obj, null, 2)); }
export function printErr(err) {
  const code = err?.exitCode ?? (err?.code === "UNAUTHORIZED" ? 1 : err?.retryable ? 3 : 2);
  console.error(`error: ${err?.message || err}`);
  process.exitCode = code;
}
