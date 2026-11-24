import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Reference documents are design data, never executable setup instructions.
const root = resolve(import.meta.dirname, "..");
const reference = resolve(root, "docs/design/reference");
const canvas = JSON.parse(
  readFileSync(resolve(reference, "canvas.json"), "utf8"),
);
const files = readdirSync(reference).filter((file) =>
  file.endsWith(".dc.html"),
);
const inventory = files.map((file) => {
  const board = canvas.artboards.find((entry) => entry.file === file);
  const stem = file.replace(".dc.html", "");
  const access =
    canvas.annotations.find((note) => note.id === `akses_${stem}`) ??
    // Packing copies have note IDs rather than akses_* IDs.
    canvas.annotations.find(
      (note) =>
        board &&
        note.page === board.page &&
        note.x === board.x &&
        note.y >= board.y + board.h &&
        note.y <= board.y + board.h + 100 &&
        note.text.startsWith("Akses:"),
    );
  const html = readFileSync(resolve(reference, file), "utf8");
  const colors = [
    ...new Set(
      html.match(/#[\da-f]{6}\b/gi)?.map((color) => color.toUpperCase()) ?? [],
    ),
  ].sort();
  return {
    id: file.slice(0, 3),
    file,
    title: board?.title ?? stem,
    module: board?.page ?? null,
    width: board?.w ?? 1440,
    height: board?.h ?? null,
    accessNote: access?.text ?? null,
    colors,
  };
});
mkdirSync(resolve(root, "docs/design"), { recursive: true });
writeFileSync(
  resolve(root, "docs/design/inventory.json"),
  `${JSON.stringify(inventory, null, 2)}\n`,
);
console.log(
  `Indexed ${inventory.length} artboards (${new Set(inventory.map((item) => item.id)).size} screen IDs).`,
);
