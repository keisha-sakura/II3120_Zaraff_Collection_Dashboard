import { NextResponse } from "next/server";
import { z } from "zod";
import { login, sessionCookie } from "@/server/auth-core";
import { apiError, jsonBody, noStore, sameOrigin } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { username, password } = z
      .object({
        username: z.string().min(2).max(50),
        password: z.string().min(1).max(256),
      })
      .strict()
      .parse(await jsonBody(request, 2048));
    const ip =
      process.env.TRUST_PROXY === "true"
        ? (request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          "direct")
        : "direct";
    const result = login(username, password, ip);
    const response = NextResponse.json(
      { user: result.user },
      { headers: noStore },
    );
    response.cookies.set(sessionCookie, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.SESSION_COOKIE_SECURE === "true" ||
        process.env.APP_URL?.startsWith("https://") === true,
      path: "/",
      expires: new Date(result.expiresAt),
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
