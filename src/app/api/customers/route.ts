import { errorResponse } from "@backend/lib/errors";
import { body, query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { customerCreateSchema } from "@backend/services/s3-member/schemas";
import { memberService } from "@backend/services/s3-member/service";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    return Response.json({ data: await memberService.list() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireRole(request, ["admin"]);
    const input = await body(request, customerCreateSchema);
    return Response.json({ data: await memberService.create(input) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
