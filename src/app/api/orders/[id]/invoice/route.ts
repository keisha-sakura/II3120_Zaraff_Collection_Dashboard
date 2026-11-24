import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireRole(request, ["admin"]);
    const { id } = await params;
    return Response.json({ data: await fulfillmentService.createInvoice(id, user.id) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
