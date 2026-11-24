import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { eq } from "drizzle-orm";
import { database } from "./db.ts";
import { uploads } from "./schema.ts";
import { HttpError } from "./auth-core.ts";
import type { User } from "../types/domain";
export const maxImageSize = 4 * 1024 * 1024;
export function imageMime(bytes: Buffer) {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  throw new HttpError(400, "Gunakan gambar PNG, JPEG, atau WebP yang valid.");
}
export async function saveUpload(file: File, user: User) {
  if (!["owner", "admin"].includes(user.role))
    throw new HttpError(403, "Unggahan hanya untuk Owner dan Admin.");
  if (file.size < 8 || file.size > maxImageSize)
    throw new HttpError(413, "Gambar maksimal 4 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = imageMime(bytes);
  const id = randomUUID();
  // Runtime data is provisioned separately and must never be bundled by Next.
  const directory = resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "uploads",
  );
  const path = join(/* turbopackIgnore: true */ directory, id);
  await mkdir(directory, {
    recursive: true,
  });
  await writeFile(path, bytes, { flag: "wx" });
  const record = {
    id,
    ownerId: user.id,
    originalName: file.name.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 160),
    mime,
    path,
    size: bytes.length,
    createdAt: new Date().toISOString(),
  };
  database().orm.insert(uploads).values(record).run();
  return { id, name: record.originalName, mime };
}
export async function readUpload(id: string, user: User) {
  if (!["owner", "admin"].includes(user.role))
    throw new HttpError(403, "Akses bukti unggahan terbatas.");
  const row = database()
    .orm.select()
    .from(uploads)
    .where(eq(uploads.id, id))
    .get();
  if (!row) throw new HttpError(404, "Unggahan tidak ditemukan.");
  return { ...row, bytes: await readFile(row.path) };
}
