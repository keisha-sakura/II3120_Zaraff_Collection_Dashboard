import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";
import { body } from "@backend/lib/route";
import { packQcSchema } from "@backend/services/s12-order-fulfillment/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = requireRole(request, ["pengemas", "admin"]);
    const { id } = await params;
    const input = await body(request, packQcSchema);
    return Response.json({
      data: await fulfillmentService.qualityCheck(
        id,
        input.kodeDitemukan,
        user.id,
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
