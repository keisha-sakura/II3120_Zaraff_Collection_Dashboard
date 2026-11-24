import { errorResponse, errors } from "@backend/lib/errors";
import { body, query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { itemCreateSchema, itemListSchema } from "@backend/services/s1-inventory/schemas";
export async function GET(request: Request) { try { const user = requireRole(request, ["penyortir", "admin", "pemilik", "host"]); const input = query(request, itemListSchema); if (user.role === "host" && input.status !== "tersedia") throw errors.akses(); return Response.json(await inventoryService.listItems(input)); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = requireRole(request, ["penyortir"]); return Response.json({ data: await inventoryService.createItem(await body(request, itemCreateSchema), user) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
