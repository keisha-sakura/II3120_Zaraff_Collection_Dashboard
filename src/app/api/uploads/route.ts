import { NextResponse } from "next/server";
import {
  apiUser,
  apiError,
  sameOrigin,
  noStore,
  boundedBody,
} from "@/server/http";
import { HttpError } from "@/server/auth-core";
import { saveUpload, maxImageSize } from "@/server/uploads";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    if (!["owner", "admin"].includes(user.role))
      throw new HttpError(403, "Unggahan hanya untuk Owner dan Admin.");
    const max = maxImageSize + 8192;
    if (Number(request.headers.get("content-length") ?? 0) > max)
      throw new HttpError(413, "Gambar maksimal 4 MB.");
    const bytes = await boundedBody(request, max);
    const data = await new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    const file = data.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Pilih gambar.");
    return NextResponse.json(await saveUpload(file, user), {
      headers: noStore,
    });
  } catch (error) {
    return apiError(error);
  }
}
