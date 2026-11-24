export function csvText(rows: readonly (readonly (string | number)[])[]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            const safe =
              typeof value === "string" && /^[\s]*[=+@-]/.test(text)
                ? `'${text}`
                : text;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function downloadCsv(
  filename: string,
  rows: readonly (readonly (string | number)[])[],
) {
  const url = URL.createObjectURL(
    new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
