import type { Metadata } from "next";
import { RolePreview } from "@/features/beranda/components/role-preview";
import { mockUsers } from "@/mocks/data/users";
export const metadata: Metadata = { title: "Pratinjau role" };
export default function PreviewPage() {
  return <RolePreview users={mockUsers} />;
}
