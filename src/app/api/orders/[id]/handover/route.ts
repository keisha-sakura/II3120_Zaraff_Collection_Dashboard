import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";
import { body } from "@backend/lib/route";
import { handoverSchema } from "@backend/services/s5-shipment/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = requireRole(request, ["admin"]);
    const { id } = await params;
    const input = await body(request, handoverSchema);
    return Response.json({
      data: await fulfillmentService.handover(id, input, user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
