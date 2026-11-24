import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { stockCountItemSchema } from "@backend/services/s1-inventory/schemas";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { requireRole(request, ["penyortir"]); const { id } = await params; return Response.json({ data: await inventoryService.recordStockCountItem(id, await body(request, stockCountItemSchema)) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
