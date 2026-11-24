import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { database, type DatabaseContext } from "./db.ts";
import { digest } from "./workspace.ts";
import * as t from "./schema.ts";
import type { User } from "../types/domain";

const duration = 8 * 60 * 60 * 1000;
export const sessionCookie = "zaraff_session";
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
}
export function checkPassword(password: string, encoded: string) {
  const [kind, salt, key] = encoded.split(":");
  if (kind !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
const publicUser = (row: typeof t.users.$inferSelect): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
});
export function sessionUser(
  token: string | undefined,
  ctx: DatabaseContext = database(),
  now = Date.now(),
): User | null {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = ctx.orm
    .select()
    .from(t.sessions)
    .where(and(eq(t.sessions.id, digest(token)), gt(t.sessions.expiresAt, now)))
    .get();
  if (!session) return null;
  const user = ctx.orm
    .select()
    .from(t.users)
    .where(eq(t.users.id, session.userId))
    .get();
  return user?.active ? publicUser(user) : null;
}
export function login(
  username: string,
  password: string,
  ip: string,
  ctx: DatabaseContext = database(),
  now = Date.now(),
) {
  const name = username.trim().toLowerCase();
  if (
    !/^[a-z0-9._-]{2,50}$/.test(name) ||
    password.length < 1 ||
    password.length > 256
  )
    throw new HttpError(400, "Nama pengguna atau kata sandi tidak valid.");
  const keys = [
    { id: digest(`user:${name}:${ip}`), max: 5 },
    { id: digest(`ip:${ip}`), max: 30 },
  ];
  for (const key of keys) {
    const limit = ctx.orm
      .select()
      .from(t.loginLimits)
      .where(eq(t.loginLimits.id, key.id))
      .get();
    if (limit && limit.lockedUntil > now)
      throw new HttpError(
        429,
        "Terlalu banyak percobaan. Coba kembali 15 menit lagi.",
      );
  }
  const row = ctx.orm
    .select()
    .from(t.users)
    .where(eq(t.users.username, name))
    .get();
  // Missing users still perform the same expensive hash operation.
  const valid = row
    ? checkPassword(password, row.passwordHash)
    : checkPassword(
        password,
        `scrypt:00000000000000000000000000000000:${"0".repeat(128)}`,
      );
  if (!valid || !row?.active) {
    ctx.sqlite
      .transaction(() => {
        for (const key of keys) {
          const old = ctx.orm
            .select()
            .from(t.loginLimits)
            .where(eq(t.loginLimits.id, key.id))
            .get();
          const failures =
            old && now - old.windowAt < 15 * 60 * 1000 ? old.failures + 1 : 1;
          const value = {
            id: key.id,
            failures,
            windowAt:
              old && now - old.windowAt < 15 * 60 * 1000 ? old.windowAt : now,
            lockedUntil: failures >= key.max ? now + 15 * 60 * 1000 : 0,
          };
          ctx.orm
            .insert(t.loginLimits)
            .values(value)
            .onConflictDoUpdate({ target: t.loginLimits.id, set: value })
            .run();
        }
      })
      .immediate();
    throw new HttpError(401, "Nama pengguna atau kata sandi salah.");
  }
  const token = randomBytes(32).toString("hex");
  ctx.sqlite
    .transaction(() => {
      for (const key of keys) {
        const limit = ctx.orm
          .select()
          .from(t.loginLimits)
          .where(eq(t.loginLimits.id, key.id))
          .get();
        if (limit && limit.lockedUntil > now)
          throw new HttpError(
            429,
            "Terlalu banyak percobaan. Coba kembali nanti.",
          );
      }
      ctx.orm
        .delete(t.loginLimits)
        .where(eq(t.loginLimits.id, keys[0].id))
        .run();
      ctx.orm
        .insert(t.sessions)
        .values({
          id: digest(token),
          userId: row.id,
          createdAt: now,
          expiresAt: now + duration,
        })
        .run();
    })
    .immediate();
  return { token, user: publicUser(row), expiresAt: now + duration };
}
export function logout(
  token: string | undefined,
  ctx: DatabaseContext = database(),
) {
  if (token)
    ctx.orm
      .delete(t.sessions)
      .where(eq(t.sessions.id, digest(token)))
      .run();
}
