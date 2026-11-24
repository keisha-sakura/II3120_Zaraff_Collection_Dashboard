import { errorResponse } from "@backend/lib/errors";
import { query } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { pricingService } from "@backend/services/s6-pricing/service";
import { suggestSchema } from "@backend/services/s6-pricing/schemas";
export async function GET(request: Request) { try { requireRole(request, ["penyortir"]); const input = query(request, suggestSchema); return Response.json({ data: await pricingService.suggest(input.kategori, input.kondisi) }); } catch (error) { return errorResponse(error); } }
