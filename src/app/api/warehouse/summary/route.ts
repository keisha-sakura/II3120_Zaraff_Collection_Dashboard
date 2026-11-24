import { errorResponse } from "@backend/lib/errors";
import { query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { warehousePeriodSchema } from "@backend/services/s1-inventory/schemas";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function GET(request: Request) { try { requireRole(request, ["penyortir", "admin", "pemilik"]); const input = query(request, warehousePeriodSchema); return Response.json({ data: await inventoryService.warehouseSummary(input.dari, input.sampai) }); } catch (error) { return errorResponse(error); } }
