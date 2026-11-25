import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";
import { deliveryContractSchema } from "@backend/services/s5-shipment/schemas";
export async function POST(request: Request): Promise<Response> {
  try {
    const input = await body(request, deliveryContractSchema);
    return Response.json({
      data: await fulfillmentService.deliveryStatus(input.noResi, input.status),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
