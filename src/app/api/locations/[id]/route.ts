import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { locationUpdateSchema } from "@backend/services/s1-inventory/schemas";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { requireRole(request, ["admin", "pemilik"]); const { id } = await params; return Response.json({ data: await inventoryService.updateLocation(id, await body(request, locationUpdateSchema)) }); } catch (error) { return errorResponse(error); } }
