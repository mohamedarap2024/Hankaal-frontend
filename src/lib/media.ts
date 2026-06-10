const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function resolveMediaUrl(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  if (url.startsWith("linear-gradient") || url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads")) return `${API_URL}${url}`;
  return url;
}

export function isGradient(value?: string): boolean {
  return !!value?.startsWith("linear-gradient");
}

export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const resolved = resolveMediaUrl(url) ?? url;
  if (resolved.includes("youtube.com/watch")) {
    return resolved.replace("watch?v=", "embed/").split("&")[0];
  }
  if (resolved.includes("youtu.be/")) {
    const id = resolved.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (resolved.includes("youtube.com/embed")) return resolved.split("?")[0];
  return null;
}

export function isDirectVideo(url?: string): boolean {
  if (!url) return false;
  const resolved = resolveMediaUrl(url) ?? url;
  if (resolved.includes("/uploads/videos/")) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(resolved);
}

export function getPlayableVideoUrl(url?: string): string | null {
  if (!url) return null;
  if (getYouTubeEmbedUrl(url)) return null;
  return resolveMediaUrl(url) ?? null;
}
