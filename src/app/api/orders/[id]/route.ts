import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";

// Full detail diorkestrasi S12: order + items + invoice + payments + packing + shipment
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    const { id } = await params;
    return Response.json({ data: await fulfillmentService.orderDetail(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
