import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { locationCreateSchema } from "@backend/services/s1-inventory/schemas";
export async function GET(request: Request) { try { requireRole(request, ["penyortir", "admin", "pemilik"]); return Response.json({ data: await inventoryService.listLocations() }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { requireRole(request, ["admin", "pemilik"]); return Response.json({ data: await inventoryService.createLocation(await body(request, locationCreateSchema)) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
