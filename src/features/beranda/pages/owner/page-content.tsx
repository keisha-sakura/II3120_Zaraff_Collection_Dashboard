import { ActionCard } from "@/components/ui/action-card";
import { ModuleIcon } from "@/components/layout/module-icon";
import { formatCurrency } from "@/lib/format";
import { ProgressSection } from "../../components/progress-section";
import { progressPercentage, type OwnerHomeData } from "../../contracts";
export function OwnerHomePage({ data }: { data: OwnerHomeData }) {
  const orders = data.orders;
  return (
    <div className="space-y-4">
      <ProgressSection
        title="Progres saat ini"
        headingId="owner-progress-heading"
        items={[
          {
            id: "sales",
            label: `Penjualan ${data.monthLabel}`,
            value: data.salesProgress,
            description: `${data.soldItems} barang terjual`,
          },
          {
            id: "orders",
            label: "Pesanan bulan ini",
            value: progressPercentage(
              orders.completed,
              orders.completed +
                orders.shipped +
                orders.packed +
                orders.awaitingPayment,
            ),
            description: `${orders.completed} selesai · ${orders.shipped} dikirim · ${orders.packed} dikemas · ${orders.awaitingPayment} menunggu pembayaran`,
          },
          {
            id: "income",
            label: `Pemasukan ${data.monthLabel}`,
            value: data.incomeProgress,
            description: formatCurrency(data.income),
          },
        ]}
      />
      <div className="grid gap-3.5 md:grid-cols-3">
        <ActionCard
          href="/laporan/strategi/baru"
          icon={<ModuleIcon module="laporan" />}
          title={`Tulis strategi ${data.nextStrategyMonth}`}
          description={`Data ${data.monthLabel} sudah lengkap`}
        />
        <ActionCard
          href={`/laporan/bulanan?bulan=${data.previousReportMonth}`}
          icon={<ModuleIcon module="laporan" />}
          title="Lihat laporan bulanan"
          description={data.previousReportLabel}
        />
      </div>
    </div>
  );
}
