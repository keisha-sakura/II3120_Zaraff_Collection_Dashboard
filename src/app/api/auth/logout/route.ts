import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logout, sessionCookie } from "@/server/auth-core";
import { apiError, noStore, sameOrigin } from "@/server/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    logout((await cookies()).get(sessionCookie)?.value);
    const response = NextResponse.json({ ok: true }, { headers: noStore });
    response.cookies.set(sessionCookie, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
