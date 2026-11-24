import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { gradePriceSchema } from "@backend/services/s1-inventory/schemas";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { requireRole(request, ["penyortir"]); const { id } = await params; return Response.json({ data: await inventoryService.setGradePrice(id, await body(request, gradePriceSchema)) }); } catch (error) { return errorResponse(error); } }
