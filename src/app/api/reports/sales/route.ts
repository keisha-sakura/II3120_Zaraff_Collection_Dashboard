import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { query } from "@backend/lib/route";
import { salesReportSchema } from "@backend/services/s8-reporting/schemas";
import { reportingService } from "@backend/services/s8-reporting/service";
export async function GET(request: Request): Promise<Response> {
  try {
    requireRole(request, ["pemilik"]);
    const input = query(request, salesReportSchema);
    const report = await reportingService.sales(input.bulan);
    if (input.format === "csv")
      return new Response(reportingService.salesCsv(report), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="penjualan-${input.bulan}.csv"`,
        },
      });
    return Response.json({ data: report });
  } catch (error) {
    return errorResponse(error);
  }
}
