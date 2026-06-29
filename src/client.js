const DEFAULT_BASE_URL = "https://api.deploysapp.com";

const ERROR_CODES = {
  UNAUTHORIZED: { retryable: false },
  PERMISSION_DENIED: { retryable: false },
  NOT_FOUND: { retryable: false },
  VALIDATION_ERROR: { retryable: false },
  CONFLICT: { retryable: false },
  RATE_LIMITED: { retryable: true },
  SERVER_ERROR: { retryable: true },
  NETWORK_ERROR: { retryable: true },
  INVALID_CONFIG: { retryable: false },
  UNKNOWN_ERROR: { retryable: false },
};

function codeForStatus(status) {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

export class DeploysAppError extends Error {
  constructor({ code, message, status, retryAfter, details }) {
    super(message);
    this.name = "DeploysAppError";
    this.code = code;
    this.status = status ?? null;
    this.retryable = ERROR_CODES[code]?.retryable ?? false;
    this.retryAfter = retryAfter ?? null;
    this.details = details ?? null;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        retryable: this.retryable,
        ...(this.retryAfter ? { retry_after_seconds: this.retryAfter } : {}),
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class DeploysAppClient {
  constructor({ apiKey, baseUrl } = {}) {
    this.apiKey = apiKey || process.env.DEPLOYSAPP_API_KEY;
    this.baseUrl = (baseUrl || process.env.DEPLOYSAPP_API_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    if (!this.apiKey) {
      throw new DeploysAppError({
        code: "INVALID_CONFIG",
        message: "Missing DEPLOYSAPP_API_KEY environment variable. Generate one at https://dashboard.deploysapp.com/dashboard/account → API Keys.",
      });
    }
    if (!/^dsa_/.test(this.apiKey)) {
      throw new DeploysAppError({
        code: "INVALID_CONFIG",
        message: "DEPLOYSAPP_API_KEY must start with 'dsa_' — looks like an invalid key.",
      });
    }
  }

  async request(method, path, { body, query } = {}) {
    let url = `${this.baseUrl}${path}`;
    if (query && Object.keys(query).length > 0) {
      const qs = new URLSearchParams(query).toString();
      url += `?${qs}`;
    }

    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Accept": "application/json",
      "User-Agent": "deploysapp-mcp/0.6.1",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      throw new DeploysAppError({
        code: "NETWORK_ERROR",
        message: `Network error contacting DeploysApp API at ${this.baseUrl}: ${cause?.message || cause}`,
        details: { cause: cause?.message || String(cause) },
      });
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      const code = codeForStatus(res.status);
      const apiMessage =
        (data && typeof data === "object" && (data.message || data.error)) ||
        (typeof data === "string" && data) ||
        res.statusText ||
        "Unknown error";
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;
      throw new DeploysAppError({
        code,
        message: `${method} ${path} → ${res.status} ${code}: ${apiMessage}`,
        status: res.status,
        retryAfter: Number.isFinite(retryAfter) ? retryAfter : null,
        details: typeof data === "object" ? data : { raw: data },
      });
    }

    return data;
  }

  get(path, query) { return this.request("GET", path, { query }); }
  post(path, body) { return this.request("POST", path, { body }); }
  patch(path, body) { return this.request("PATCH", path, { body }); }
  delete(path) { return this.request("DELETE", path); }
}
