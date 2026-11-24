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
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    const { domain } = await params;
    const result = executeOperation(
      domain,
      await jsonBody(request),
      user,
      request.headers.get("idempotency-key") ?? "",
    );
    return NextResponse.json(
      { ...result, state: visibleWorkspace(result.state, user) },
      { headers: noStore },
    );
  } catch (error) {
    return apiError(error);
  }
}
