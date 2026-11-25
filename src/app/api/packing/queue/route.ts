import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";

export async function GET(request: Request): Promise<Response> {
  try {
    requireRole(request, ["pengemas", "admin"]);
    return Response.json({ data: await fulfillmentService.packingQueue() });
  } catch (error) {
    return errorResponse(error);
  }
}
