import { NextResponse } from "next/server";
import { apiUser, apiError, noStore } from "@/server/http";
export async function GET() {
  try {
    return NextResponse.json({ user: await apiUser() }, { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}
