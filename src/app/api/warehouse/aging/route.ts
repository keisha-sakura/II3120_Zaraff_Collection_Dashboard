import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function GET(request: Request) { try { requireRole(request, ["penyortir", "admin", "pemilik"]); return Response.json({ data: await inventoryService.warehouseAging() }); } catch (error) { return errorResponse(error); } }
