import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { body } from "@backend/lib/route";
import { strategySchema } from "@backend/services/s11-sales-strategy/schemas";
import { strategyService } from "@backend/services/s11-sales-strategy/service";
export async function GET(request: Request): Promise<Response> {
  try {
    requireRole(request, ["pemilik"]);
    return Response.json({ data: await strategyService.list() });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request): Promise<Response> {
  try {
    const user = requireRole(request, ["pemilik"]);
    const input = await body(request, strategySchema);
    return Response.json(
      { data: await strategyService.create(input, user.id) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
