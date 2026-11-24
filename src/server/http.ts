import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { HttpError, sessionCookie, sessionUser } from "./auth-core.ts";
export async function apiUser() {
  const user = sessionUser((await cookies()).get(sessionCookie)?.value);
  if (!user) throw new HttpError(401, "Silakan masuk kembali.");
  return user;
}
export function sameOrigin(request: Request) {
  // Next may use an internal hostname in request.url. Pin the public origin
  // when configured; otherwise compare against the incoming Host header.
  const url = new URL(request.url);
  const expected = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("x-zaraff-request") !== "1"
  )
    throw new HttpError(403, "Permintaan tidak diizinkan.");
}
export async function jsonBody(request: Request, max = 1_100_000) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Gunakan data JSON.");
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new HttpError(413, "Data terlalu besar.");
  const text = (await boundedBody(request, max)).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "Data JSON tidak valid.");
  }
}
/** Stop oversized chunked requests before allocating their entire body. */
export async function boundedBody(request: Request, max: number) {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new HttpError(413, "Data terlalu besar.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}
export const noStore = { "Cache-Control": "private, no-store" };
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: noStore },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: "Data tidak valid.",
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400, headers: noStore },
    );
  console.error(
    "Backend error",
    error instanceof Error ? error.message : "Unknown error",
  );
  return NextResponse.json(
    { error: "Terjadi kesalahan server. Coba kembali." },
    { status: 500, headers: noStore },
  );
}
