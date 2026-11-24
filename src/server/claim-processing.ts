import { eq } from "drizzle-orm";
import type { User } from "../types/domain";
import {
  parseCommentInput,
  commentClaim,
} from "../features/penjualan/comment-input.ts";
import { database, type DatabaseContext } from "./db.ts";
import { executeOperation } from "./operations.ts";
import { classifyComments } from "./gemini.ts";
import { salesCommand } from "./validation.ts";
import { HttpError } from "./auth-core.ts";
import { lives, liveItems, requests } from "./schema.ts";

export async function processCommentClaims(
  body: unknown,
  user: User,
  key: string,
  ctx: DatabaseContext = database(),
  fetcher: typeof fetch = fetch,
) {
  if (!["owner", "admin"].includes(user.role))
    throw new HttpError(403, "Proses klaim hanya untuk Owner/Admin.");
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key))
    throw new HttpError(400, "Idempotency key wajib diisi.");
  const command = salesCommand.parse(body);
  if (command.type !== "process-claims")
    throw new HttpError(400, "Perintah klaim tidak valid.");
  // Replays must not call the model again; executeOperation still verifies the payload hash.
  if (
    ctx.orm
      .select()
      .from(requests)
      .where(eq(requests.id, `${user.id}:${key}`))
      .get()
  )
    return executeOperation("sales", body, user, key, ctx);
  const live = ctx.orm
    .select()
    .from(lives)
    .where(eq(lives.id, command.liveId))
    .get();
  if (!live || live.status !== "completed" || live.claimsProcessed)
    throw new HttpError(
      409,
      "Pilih live selesai yang klaimnya belum diproses.",
    );
  let input;
  try {
    input = parseCommentInput(command.text);
  } catch (error) {
    throw new HttpError(
      400,
      error instanceof Error ? error.message : "Format komentar tidak valid.",
    );
  }
  if (!input.length || input.length > 1000)
    throw new HttpError(400, "Masukkan 1–1.000 komentar.");
  const itemIds = ctx.orm
    .select()
    .from(liveItems)
    .where(eq(liveItems.liveId, command.liveId))
    .all()
    .map((row) => row.itemId);
  const candidates = input.filter(
    (row) =>
      !row.structured &&
      !row.error &&
      row.codes.length > 0 &&
      row.codes.some((code) => itemIds.includes(code)),
  );
  const checked = candidates.length
    ? await classifyComments(candidates, user, ctx, fetcher)
    : null;
  const rows = input.map(
    (row) =>
      checked?.rows.find((claim) => claim.line === row.line) ??
      commentClaim(
        row,
        row.codes[0] ?? "",
        row.codes.length && !row.codes.some((code) => itemIds.includes(code))
          ? "Kode barang tidak termasuk dalam live ini."
          : row.structured
            ? undefined
            : "Komentar tidak menyebut kode barang.",
      ),
  );
  if (rows.every((row) => row.error)) {
    const outsideLive = [
      ...new Set(
        input
          .filter((row) => !row.error)
          .flatMap((row) => row.codes)
          .filter((code) => !itemIds.includes(code)),
      ),
    ];
    if (outsideLive.length) {
      const listed = outsideLive.slice(0, 5).join(", ");
      const allowed = itemIds.slice(0, 6).join(", ");
      throw new HttpError(
        400,
        `Belum ada klaim yang valid. Kode ${listed}${outsideLive.length > 5 ? " dan lainnya" : ""} tidak terdaftar pada live "${live.title}". ${allowed ? `Kode barang live ini: ${allowed}${itemIds.length > 6 ? " dan lainnya" : ""}.` : "Live ini belum memiliki barang terdaftar."}`,
      );
    }
    const reasons = [...new Set(rows.map((row) => row.error).filter(Boolean))]
      .slice(0, 3)
      .join(" ");
    throw new HttpError(
      400,
      `Belum ada klaim pembelian yang valid. ${reasons}`,
    );
  }
  // Network calls finish before the write transaction. Stock/state are rechecked inside it.
  return executeOperation(
    "sales",
    body,
    user,
    key,
    ctx,
    new Date().toISOString(),
    {
      rows,
      analysis: { comments: input, decisions: checked?.decisions ?? null },
    },
  );
}
