import { errorResponse } from "@backend/lib/errors";
import { userFromRequest } from "@backend/lib/requireRole";

export async function GET(request: Request) {
  try {
    return Response.json({ user: userFromRequest(request) });
  } catch (error) {
    return errorResponse(error);
  }
}
