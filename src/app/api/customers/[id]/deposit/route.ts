import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { depositSchema } from "@backend/services/s3-member/schemas";
import { memberService } from "@backend/services/s3-member/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["admin"]);
    const { id } = await params;
    const input = await body(request, depositSchema);
    return Response.json({ data: await memberService.addDeposit(id, input.jumlah) });
  } catch (error) {
    return errorResponse(error);
  }
}
