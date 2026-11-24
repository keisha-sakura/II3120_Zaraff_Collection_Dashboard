import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { AppError, errors } from "./errors";

export const roles = ["pemilik", "admin", "penyortir", "host", "pengemas"] as const;
export type Role = (typeof roles)[number];
export type AuthUser = { id: string; username: string; role: Role };
const secret = process.env.JWT_SECRET ?? "zaraff-development-secret-ganti-di-produksi";

function asUser(payload: jwt.JwtPayload | string): AuthUser {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.username !== "string" ||
    !roles.includes(payload.role as Role)
  )
    throw errors.autentikasi();
  return { id: payload.sub, username: payload.username, role: payload.role as Role };
}

export function signToken(user: AuthUser) {
  return jwt.sign({ username: user.username, role: user.role }, secret, {
    subject: user.id,
    expiresIn: "8h",
  });
}

export function verifyToken(token: string) {
  try {
    return asUser(jwt.verify(token, secret));
  } catch {
    throw errors.autentikasi();
  }
}

export async function login(username: string, password: string) {
  const user = await db.appUser.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError(
      401,
      "KREDENSIAL_SALAH",
      "Username atau kata sandi salah",
    );
  const publicUser: AuthUser = { id: user.id, username: user.username, role: user.role as Role };
  return { user: publicUser, token: signToken(publicUser) };
}
