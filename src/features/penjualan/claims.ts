import type { ClaimRow } from "./model";
export function normalizeHandle(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}
export function validHandle(value: string) {
  return /^@[a-z0-9._]{2,30}$/i.test(value);
}
export function csvCells(line: string): string[] | null {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else value += char;
  }
  if (quoted) return null;
  cells.push(value.trim());
  return cells;
}
export function parseClaims(text: string): ClaimRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  return lines
    .flatMap((raw, index) => {
      if (!raw.trim()) return [];
      const cells = csvCells(raw);
      if (
        index === 0 &&
        cells?.length === 3 &&
        /^(handle|pembeli)$/i.test(cells[0]) &&
        /^(waktu|time)$/i.test(cells[2])
      )
        return [];
      const [handleRaw = "", code = "", timeRaw = ""] = cells ?? [];
      const handle = normalizeHandle(handleRaw);
      const itemCode = code.toUpperCase();
      const match =
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.,](\d{1,3}))?$/.exec(timeRaw);
      const milliseconds = match
        ? ((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) *
            1000 +
          Number((match[4] ?? "").padEnd(3, "0"))
        : null;
      const error =
        !cells || cells.length !== 3
          ? "Gunakan tiga kolom: handle, kode, waktu."
          : !validHandle(handle)
            ? "Handle pembeli tidak valid."
            : !/^ZR-\d{4}-\d{4,}$/.test(itemCode)
              ? "Format kode barang tidak valid."
              : milliseconds === null
                ? "Waktu harus HH:MM:SS atau HH:MM:SS.mmm."
                : null;
      return [
        {
          line: index + 1,
          handle: handleRaw ? handle : "—",
          itemCode: itemCode || "—",
          time: match
            ? `${match[1]}:${match[2]}:${match[3]}.${(match[4] ?? "").padEnd(3, "0")}`
            : timeRaw || "—",
          milliseconds,
          error,
        },
      ];
    })
    .slice(0, 1001);
}
