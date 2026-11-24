import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { validatePaymentSchema } from "@backend/services/s4-payment/schemas";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireRole(request, ["admin"]);
    const { id } = await params;
    const input = await body(request, validatePaymentSchema);
    return Response.json({
      data: await fulfillmentService.validatePayment(id, input.keputusan, input.alasan, user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
