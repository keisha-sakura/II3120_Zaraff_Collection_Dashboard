import { z } from "zod";
import { login } from "@backend/lib/auth";
import { errorResponse } from "@backend/lib/errors";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { username, password } = z
      .object({
        username: z.string().min(2).max(50).trim(),
        password: z.string().min(1).max(256),
      })
      .strict()
      .parse(await request.json());
    const result = await login(username, password);
    const response = Response.json(result);
    response.headers.append(
      "Set-Cookie",
      `zaraff_token=${encodeURIComponent(result.token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,
    );
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
