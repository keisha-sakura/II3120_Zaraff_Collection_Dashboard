import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { pricingService } from "@backend/services/s6-pricing/service";
import { pricingRulesSchema } from "@backend/services/s6-pricing/schemas";
export async function GET(request: Request) { try { requireRole(request, ["penyortir", "admin", "pemilik"]); return Response.json({ data: await pricingService.rules() }); } catch (error) { return errorResponse(error); } }
export async function PUT(request: Request) { try { requireRole(request, ["admin", "pemilik"]); const input = await body(request, pricingRulesSchema); return Response.json({ data: await pricingService.replaceRules(input.rules) }); } catch (error) { return errorResponse(error); } }
