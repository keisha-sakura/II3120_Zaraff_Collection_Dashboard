import { csvCells, parseClaims } from "./claims.ts";
import type { ClaimRow } from "./model";

export type ImportedComment = {
  line: number;
  handle: string;
  time: string;
  comment: string;
  structured: boolean;
  codes: string[];
  error: string | null;
};
export const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
export function appendManualClaim(
  source: string,
  handle: string,
  code: string,
  time: string,
) {
  const first =
    csvCells(
      source
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .find((line) => line.trim()) ?? "",
    ) ?? [];
  const header = first.map((cell) => cell.toLowerCase().replace(/[\s_-]/g, ""));
  const handles = ["handle", "pembeli", "username", "user"];
  const times = ["waktu", "time", "timestamp"];
  const comments = ["komentar", "comment", "text", "message"];
  const codes = ["kode", "code", "itemcode", "kodebarang"];
  const hasHeader =
    header.some((cell) => handles.includes(cell)) &&
    header.some((cell) => times.includes(cell)) &&
    header.some((cell) => [...comments, ...codes].includes(cell));
  const values = hasHeader
    ? header.map((cell) =>
        handles.includes(cell)
          ? handle
          : times.includes(cell)
            ? time
            : codes.includes(cell)
              ? code
              : comments.includes(cell)
                ? `Claim ${code}`
                : "",
      )
    : [handle, code, time];
  return `${source.trim()}${source.trim() ? "\n" : ""}${values.map(csvCell).join(",")}`;
}
export function commentClaim(
  row: ImportedComment,
  code: string,
  error?: string,
): ClaimRow {
  const claim = parseClaims(
    [row.handle, code, row.time].map(csvCell).join(","),
  )[0];
  return { ...claim, line: row.line, error: row.error ?? error ?? claim.error };
}
function imported(
  line: number,
  handle: string,
  comment: string,
  time: string,
  structured: boolean,
): ImportedComment {
  const codes = structured
    ? [comment.trim().toUpperCase()]
    : [...new Set(comment.toUpperCase().match(/\bZR-\d{4}-\d{4,}\b/g) ?? [])];
  const base = parseClaims(
    [handle, codes[0] ?? "ZR-0000-0000", time.replace(/\s+WIB$/i, "").trim()]
      .map(csvCell)
      .join(","),
  )[0];
  return {
    line,
    handle: base.handle,
    time: base.time,
    comment,
    structured,
    codes,
    error: base.error,
  };
}
/** CSV records retain their original start line, including quoted multiline comments. */
function csvRecords(text: string) {
  const records: { line: number; cells: string[] }[] = [];
  let cells: string[] = [],
    value = "",
    quoted = false,
    line = 1,
    start = 1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && (quoted || !value.trim())) {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else if (char === "\n" && !quoted) {
      cells.push(value.trim());
      if (cells.some(Boolean)) records.push({ line: start, cells });
      cells = [];
      value = "";
      line++;
      start = line;
    } else {
      value += char;
      if (char === "\n") line++;
    }
  }
  if (quoted) throw new Error("Tanda kutip pada CSV belum ditutup.");
  cells.push(value.trim());
  if (cells.some(Boolean)) records.push({ line: start, cells });
  return records;
}
function parseCsv(text: string) {
  const records = csvRecords(text);
  const first =
    records[0]?.cells.map((cell) =>
      cell.toLowerCase().replace(/[\s_-]/g, ""),
    ) ?? [];
  const handleIndex = first.findIndex((cell) =>
    ["handle", "pembeli", "username", "user"].includes(cell),
  );
  const timeIndex = first.findIndex((cell) =>
    ["waktu", "time", "timestamp"].includes(cell),
  );
  const commentIndex = first.findIndex((cell) =>
    [
      "komentar",
      "comment",
      "text",
      "message",
      "kode",
      "code",
      "itemcode",
      "kodebarang",
    ].includes(cell),
  );
  const header = handleIndex >= 0 && timeIndex >= 0 && commentIndex >= 0;
  return records.slice(header ? 1 : 0).map(({ line, cells }) => {
    const comment = cells[header ? commentIndex : 1] ?? "";
    const structured = header
      ? ["kode", "code", "itemcode", "kodebarang"].includes(first[commentIndex])
      : /^ZR-\d{4}-\d{4,}$/i.test(comment);
    const row = imported(
      line,
      cells[header ? handleIndex : 0] ?? "",
      comment,
      cells[header ? timeIndex : 2] ?? "",
      structured,
    );
    if (
      (!header && cells.length !== 3) ||
      (header && cells.length !== first.length)
    )
      row.error = "CSV harus memuat handle, komentar atau kode, dan waktu.";
    return row;
  });
}
export function parseCommentInput(text: string): ImportedComment[] {
  const source = text.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
  if (!source.trim()) return [];
  const lines = source.split("\n");
  const chatHeader = /^\[([^\]]+)\]\s*(@[a-z0-9._]+)\s*(.*)$/i;
  if (!lines.some((line) => chatHeader.test(line.trim())))
    return parseCsv(source);
  const rows: ImportedComment[] = [];
  let current: {
    line: number;
    handle: string;
    time: string;
    parts: string[];
  } | null = null;
  const flush = () => {
    if (current)
      rows.push(
        imported(
          current.line,
          current.handle,
          current.parts.join("\n").trim(),
          current.time,
          false,
        ),
      );
    current = null;
  };
  for (const [index, raw] of lines.entries()) {
    const value = raw.trim();
    const match = chatHeader.exec(value);
    if (match) {
      flush();
      current = {
        line: index + 1,
        handle: match[2],
        time: match[1],
        parts: [match[3]],
      };
    } else if (
      csvCells(value)?.length === 3 &&
      /^@?[a-z0-9._]{2,30}$/i.test(csvCells(value)![0]) &&
      /^ZR-\d{4}-\d{4,}$/i.test(csvCells(value)![1])
    ) {
      flush();
      rows.push(...parseCsv(value).map((row) => ({ ...row, line: index + 1 })));
    } else if (current) current.parts.push(raw);
    else if (
      value &&
      !/^(RIWAYAT KOMENTAR|Tanggal\s*:|Zona waktu\s*:)/i.test(value)
    ) {
      const row = imported(index + 1, "", value, "", false);
      row.error =
        "Gunakan format [HH:MM:SS.mmm] @handle diikuti komentar, atau CSV.";
      rows.push(row);
    }
  }
  flush();
  return rows;
}
