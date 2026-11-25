import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = requireRole(request, ["pengemas", "admin"]);
    const { id } = await params;

    return Response.json({ data: await fulfillmentService.pack(id, user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
