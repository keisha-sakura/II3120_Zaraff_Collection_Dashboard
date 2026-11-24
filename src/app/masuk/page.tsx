import type { Metadata } from "next";
import { LoginPage } from "@/features/auth/pages/masuk/page-content";
import { currentUser } from "@/server/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Masuk" };

export default async function Page() {
  if (await currentUser()) redirect("/beranda");
  return <LoginPage />;
}
