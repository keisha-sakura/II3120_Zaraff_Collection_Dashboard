import { z } from "zod";
import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { query } from "@backend/lib/route";
import { riwayatStatus } from "@backend/services/audit/service";
const auditQuerySchema = z
  .object({
    entitas: z.string().min(1).optional(),
    entitasId: z.string().min(1).optional(),
  })
  .strict();
export async function GET(request: Request): Promise<Response> {
  try {
    requireRole(request, ["pemilik", "admin"]);
    const input = query(request, auditQuerySchema);
    return Response.json({
      data: await riwayatStatus(input.entitas, input.entitasId),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
