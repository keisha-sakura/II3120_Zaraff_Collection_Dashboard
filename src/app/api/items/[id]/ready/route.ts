import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { readySchema } from "@backend/services/s1-inventory/schemas";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = requireRole(request, ["penyortir"]); const { id } = await params; const input = await body(request, readySchema); return Response.json({ data: await inventoryService.readyItem(id, input.locationId, user) }); } catch (error) { return errorResponse(error); } }
