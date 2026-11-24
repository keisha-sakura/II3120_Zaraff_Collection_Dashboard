import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
export default async function Page() {
  await requireUser();
  redirect("/beranda");
}
