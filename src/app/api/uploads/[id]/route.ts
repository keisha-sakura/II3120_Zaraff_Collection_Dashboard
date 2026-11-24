import { apiUser, apiError, noStore } from "@/server/http";
import { readUpload } from "@/server/uploads";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    const file = await readUpload(id, user);
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        ...noStore,
        "Content-Type": file.mime,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
