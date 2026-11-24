import type { Metadata } from "next";
import { RolePreview } from "@/features/beranda/components/role-preview";
import { requireUser } from "@/server/auth";
import { notFound } from "next/navigation";
export const metadata: Metadata = { title: "Pratinjau role" };
export default async function PreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const user = await requireUser();
  return <RolePreview users={[user]} />;
}
