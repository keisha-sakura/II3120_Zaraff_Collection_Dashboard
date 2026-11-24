import { errorResponse } from "@backend/lib/errors";
import { body, query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { baleCreateSchema, baleListSchema } from "@backend/services/s1-inventory/schemas";
export async function GET(request: Request) { try { requireRole(request, ["penyortir", "admin", "pemilik"]); return Response.json(await inventoryService.listBales(query(request, baleListSchema))); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = requireRole(request, ["penyortir"]); return Response.json({ data: await inventoryService.createBale(await body(request, baleCreateSchema), user) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
