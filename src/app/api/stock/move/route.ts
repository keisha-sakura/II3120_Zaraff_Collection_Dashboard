import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { stockMoveSchema } from "@backend/services/s1-inventory/schemas";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function POST(request: Request) { try { const user = requireRole(request, ["penyortir"]); return Response.json({ data: await inventoryService.moveStock(await body(request, stockMoveSchema), user) }); } catch (error) { return errorResponse(error); } }
