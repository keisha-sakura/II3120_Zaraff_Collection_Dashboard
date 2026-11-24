import { redirect } from "next/navigation";
import { requirePage } from "@/server/auth";
export default async function Page() {
  await requirePage("S01");
  redirect("/pengaturan/harga");
}
