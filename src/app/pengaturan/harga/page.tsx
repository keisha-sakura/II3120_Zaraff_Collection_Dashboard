import type { Metadata } from "next";
import {
  renderSettingsRoute,
  type SettingsQuery,
} from "@/features/pengaturan/route";
export const metadata: Metadata = { title: "Aturan harga" };
export default async function Page({
  searchParams,
}: {
  searchParams: SettingsQuery;
}) {
  return renderSettingsRoute({ page: "S01" }, searchParams);
}
