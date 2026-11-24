import type { Metadata } from "next";
import {
  renderSettingsRoute,
  type SettingsQuery,
} from "@/features/pengaturan/route";
export const metadata: Metadata = { title: "Diskon member" };
export default async function Page({
  searchParams,
}: {
  searchParams: SettingsQuery;
}) {
  return renderSettingsRoute({ page: "S02" }, searchParams);
}
