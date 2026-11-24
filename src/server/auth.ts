import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { canAccessPage, type PageId } from "../config/pages.ts";
import { sessionCookie, sessionUser } from "./auth-core.ts";
export async function currentUser() {
  return sessionUser((await cookies()).get(sessionCookie)?.value);
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/masuk");
  return user;
}
export async function requirePage(page: PageId) {
  const user = await requireUser();
  if (!canAccessPage(user.role, page)) notFound();
  return user;
}
