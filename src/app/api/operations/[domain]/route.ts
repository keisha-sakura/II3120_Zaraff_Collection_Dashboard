import { NextResponse } from "next/server";
import {
  apiUser,
  apiError,
  jsonBody,
  noStore,
  sameOrigin,
} from "@/server/http";
import { executeOperation } from "@/server/operations";
import { visibleWorkspace } from "@/server/workspace";
import { processCommentClaims } from "@/server/claim-processing";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    const { domain } = await params;
    const body = await jsonBody(request);
    const key = request.headers.get("idempotency-key") ?? "";
    const result =
      domain === "sales" &&
      body &&
      typeof body === "object" &&
      "type" in body &&
      body.type === "process-claims"
        ? await processCommentClaims(body, user, key)
        : executeOperation(domain, body, user, key);
    return NextResponse.json(
      { ...result, state: visibleWorkspace(result.state, user) },
      { headers: noStore },
    );
  } catch (error) {
    return apiError(error);
  }
}
