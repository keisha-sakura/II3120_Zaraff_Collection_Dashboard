/** Compose classes; avoid conflicting utilities in the same call. */
export function cn(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}
