"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { DashboardLink } from "@/components/layout/dashboard-link";
import { useSales } from "./sales-provider";
export function SalesLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardLink
      href={href}
      className="text-primary font-semibold hover:underline"
    >
      {children}
    </DashboardLink>
  );
}
export function MissingSalesRecord({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <EmptyState
      title={`${label} tidak ditemukan`}
      description="Periksa kembali data atau alamat halaman."
      action={<SalesLink href={href}>Kembali ke daftar</SalesLink>}
    />
  );
}
export function LiveSteps({ step }: { step: "content" | "items" | "publish" }) {
  return (
    <Stepper
      activeId={step}
      steps={[
        { id: "content", label: "Konten dan jadwal" },
        { id: "items", label: "Pilih barang" },
        { id: "publish", label: "Tinjau dan publikasikan" },
      ]}
    />
  );
}
export function DraftRequired() {
  return (
    <EmptyState
      title="Isi konten dan jadwal terlebih dahulu"
      action={
        <SalesLink href="/penjualan/live/baru/konten">
          Mulai jadwalkan live
        </SalesLink>
      }
    />
  );
}
export function CancelDraft() {
  const { run, go } = useSales();
  return (
    <Button
      variant="text"
      onClick={async () => {
        if (await run({ type: "discard-draft" })) go("/penjualan/live");
      }}
    >
      Batal
    </Button>
  );
}
export function toWibInput(value: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (name: string) =>
    parts.find((part) => part.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
