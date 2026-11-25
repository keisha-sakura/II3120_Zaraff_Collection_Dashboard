import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";
import { body } from "@backend/lib/route";
import { shipmentStatusSchema } from "@backend/services/s5-shipment/schemas";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  try {
    const user = requireRole(request, ["admin"]);
    const { orderId } = await params;
    const input = await body(request, shipmentStatusSchema);
    return Response.json({
      data: await fulfillmentService.updateShipmentStatus(
        orderId,
        input.status,
        input.catatan,
        user.id,
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
