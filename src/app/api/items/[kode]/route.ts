import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function GET(request: Request, { params }: { params: Promise<{ kode: string }> }) { try { requireRole(request, ["penyortir", "admin", "pemilik", "host"]); const { kode } = await params; return Response.json({ data: await inventoryService.itemDetail(kode) }); } catch (error) { return errorResponse(error); } }
