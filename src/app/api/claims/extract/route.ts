import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiUser,
  apiError,
  jsonBody,
  noStore,
  sameOrigin,
} from "@/server/http";
import { extractClaims } from "@/server/gemini";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    const input = z
      .object({
        liveId: z.string().min(1).max(100),
        text: z.string().max(64000).optional(),
        uploadId: z.string().uuid().optional(),
      })
      .strict()
      .parse(await jsonBody(request, 70000));
    return NextResponse.json(await extractClaims(input, user), {
      headers: noStore,
    });
  } catch (error) {
    return apiError(error);
  }
}
