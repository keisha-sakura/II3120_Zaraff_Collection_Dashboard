"use client";
import { DashboardLink } from "@/components/layout/dashboard-link";
import { Badge, LocationBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { itemStatuses, baleStatuses } from "@/config/statuses";
import type { BaleStatus, ItemStatus } from "@/types/domain";
export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge tone={itemStatuses[status].tone}>{itemStatuses[status].label}</Badge>
  );
}
export function BaleStatusBadge({ status }: { status: BaleStatus }) {
  return (
    <Badge tone={baleStatuses[status].tone}>{baleStatuses[status].label}</Badge>
  );
}
export function Location({ code }: { code: string | null }) {
  return code ? <LocationBadge>{code}</LocationBadge> : <>—</>;
}
export function CancelLink({
  href,
  children = "Batal",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <DashboardLink
      href={href}
      className="text-primary inline-block py-2 text-sm font-semibold hover:underline"
    >
      {children}
    </DashboardLink>
  );
}
export function MissingRecord({
  kind,
  href,
}: {
  kind: "Bale" | "Barang";
  href: string;
}) {
  return (
    <EmptyState
      title={`${kind} tidak ditemukan`}
      description="Data mungkin sudah berubah atau kode pada alamat tidak sesuai."
      action={<CancelLink href={href}>Kembali ke daftar</CancelLink>}
    />
  );
}
