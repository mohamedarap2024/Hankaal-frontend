/** Same-origin in production (Vercel proxy). Direct backend URL only for local dev. */
const configured = import.meta.env.VITE_API_URL;
export const API_URL =
  configured != null && String(configured).trim() !== ""
    ? String(configured).replace(/\/$/, "")
    : import.meta.env.DEV
      ? "http://localhost:3001"
      : "";

export const API_KEY = import.meta.env.VITE_API_KEY ?? "";

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  return headers;
}
