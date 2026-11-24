import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { stockCountCreateSchema } from "@backend/services/s1-inventory/schemas";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function POST(request: Request) { try { const user = requireRole(request, ["penyortir"]); const input = await body(request, stockCountCreateSchema); return Response.json({ data: await inventoryService.startStockCount(input.locationIds, user) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
