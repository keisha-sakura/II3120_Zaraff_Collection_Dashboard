import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = requireRole(request, ["penyortir"]); const { id } = await params; return Response.json({ data: await inventoryService.submitStockCount(id, user) }); } catch (error) { return errorResponse(error); } }
