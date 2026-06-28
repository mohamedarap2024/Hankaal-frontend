/** Format a date safely. Returns "—" for missing or invalid values (avoids the 1/1/1970 trap). */
export function formatDate(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
  return d.toLocaleDateString();
}

/** Same as formatDate but includes the time. */
export function formatDateTime(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
  return d.toLocaleString();
}
