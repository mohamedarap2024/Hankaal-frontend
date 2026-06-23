const stripTrailingSlash = (s: string) => s.replace(/\/$/, "");

/**
 * Browser-facing base URL.
 * - Production: empty string → same-origin, so the browser hits `/api/...` on
 *   the Vercel domain and the `vercel.json` rewrite proxies it to Render.
 * - Local dev: the backend on localhost:3001.
 */
const configured = import.meta.env.VITE_API_URL;
export const API_URL =
  configured != null && String(configured).trim() !== ""
    ? stripTrailingSlash(String(configured))
    : import.meta.env.DEV
      ? "http://localhost:3001"
      : "";

/**
 * Base URL for server-side (SSR) fetches.
 *
 * During SSR there is no browser origin, so a relative `/api/...` URL cannot be
 * parsed and the Vercel proxy never runs — the request must go straight to the
 * backend with an absolute URL. Resolved from runtime env on the server, with a
 * production fallback to the known Render URL.
 */
function serverApiBase(): string {
  const fromEnv =
    process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? process.env.API_URL;
  if (fromEnv && fromEnv.trim()) return stripTrailingSlash(fromEnv.trim());
  if (import.meta.env.DEV) return "http://localhost:3001";
  return "https://hankaal-backend.onrender.com";
}

/**
 * Base URL to prefix `fetch()` calls with: an absolute backend URL on the
 * server (SSR), the same-origin proxy in the browser.
 */
export function apiBase(): string {
  return typeof window === "undefined" ? serverApiBase() : API_URL;
}

export const API_KEY = import.meta.env.VITE_API_KEY ?? "";

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  return headers;
}
