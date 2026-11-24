import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { memberService } from "@backend/services/s3-member/service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    const { id } = await params;
    return Response.json({ data: await memberService.memberStatus(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
