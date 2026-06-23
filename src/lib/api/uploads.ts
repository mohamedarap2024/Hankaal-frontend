import { ApiError } from "./client";
import { apiBase, apiHeaders } from "./config";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hankaal_token");
}

export async function uploadFile(file: File, type: "image" | "video") {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = apiHeaders();
  if (token) headers.Authorization = `Bearer ${token}`;

  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/api/uploads/${type}`, { method: "POST", headers, body: formData });
  } catch {
    throw new ApiError(`Cannot reach server at ${base || "the API"}`, 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? "Upload failed", res.status);
  }

  return data as { url: string };
}
