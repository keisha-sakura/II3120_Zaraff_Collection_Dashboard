import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { customerUpdateSchema } from "@backend/services/s3-member/schemas";
import { memberService } from "@backend/services/s3-member/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["admin"]);
    const { id } = await params;
    const input = await body(request, customerUpdateSchema);
    return Response.json({ data: await memberService.update(id, input) });
  } catch (error) {
    return errorResponse(error);
  }
}
