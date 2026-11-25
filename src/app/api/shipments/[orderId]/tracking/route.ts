import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { shipmentService } from "@backend/services/s5-shipment/service";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  try {
    requireRole(request, ["admin"]);
    const { orderId } = await params;
    return Response.json({ data: await shipmentService.tracking(orderId) });
  } catch (error) {
    return errorResponse(error);
  }
}
