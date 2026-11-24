import { serverConfig } from "@/server/config";
import { database } from "@/server/db";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    database().sqlite.prepare("SELECT id FROM users LIMIT 1").get();
  } catch {
    return Response.json(
      { status: "unavailable", service: serverConfig.appName },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(
    {
      status: "ok",
      service: serverConfig.appName,
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
