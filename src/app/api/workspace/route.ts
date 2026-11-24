import { NextResponse } from "next/server";
import { apiUser, apiError, noStore } from "@/server/http";
import { database } from "@/server/db";
import { loadWorkspace, visibleWorkspace } from "@/server/workspace";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await apiUser();
    const ctx = database();
    const state = ctx.sqlite
      .transaction(() => visibleWorkspace(loadWorkspace(ctx, user.id), user))
      .deferred();
    return NextResponse.json(
      {
        user,
        state,
      },
      { headers: noStore },
    );
  } catch (error) {
    return apiError(error);
  }
}
