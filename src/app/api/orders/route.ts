import { errorResponse } from "@backend/lib/errors";
import { query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { orderListSchema } from "@backend/services/s2-order/schemas";
import { orderService } from "@backend/services/s2-order/service";

export async function GET(request: Request) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    const input = query(request, orderListSchema);
    return Response.json({ data: await orderService.list(input) });
  } catch (error) {
    return errorResponse(error);
  }
}
