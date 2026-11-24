import { errorResponse } from "@backend/lib/errors";
import { query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { movementQuerySchema } from "@backend/services/s1-inventory/schemas";
import { inventoryService } from "@backend/services/s1-inventory/service";
export async function GET(request: Request) { try { requireRole(request, ["penyortir", "admin", "pemilik"]); const input = query(request, movementQuerySchema); return Response.json({ data: await inventoryService.movements(input.objekTipe, input.objekId) }); } catch (error) { return errorResponse(error); } }
