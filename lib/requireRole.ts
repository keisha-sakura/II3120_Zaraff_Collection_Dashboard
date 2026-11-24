import { type AuthUser, type Role, verifyToken } from "./auth";
import { errors } from "./errors";

export function userFromRequest(request: Request): AuthUser {
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const cookie = request.headers.get("cookie")?.match(/(?:^|; )zaraff_token=([^;]+)/)?.[1];
  if (!bearer && !cookie) throw errors.autentikasi();
  return verifyToken(bearer ?? decodeURIComponent(cookie!));
}

export function requireRole(request: Request, allowed: readonly Role[]) {
  const user = userFromRequest(request);
  if (!allowed.includes(user.role)) throw errors.akses();
  return user;
}
