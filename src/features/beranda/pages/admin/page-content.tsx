import { ActionCard } from "@/components/ui/action-card";
import { ModuleIcon } from "@/components/layout/module-icon";
import { ProgressSection } from "../../components/progress-section";
import { progressPercentage, type AdminHomeData } from "../../contracts";
export function AdminHomePage({ data }: { data: AdminHomeData }) {
  const { payments, shipping, live } = data;
  return (
    <div className="space-y-4">
      <ProgressSection
        title="Progres saat ini"
        headingId="admin-progress-heading"
        items={[
          {
            id: "payments",
            label: `Pembayaran pesanan ${data.liveLabel}`,
            value: progressPercentage(
              payments.paid,
              payments.paid + payments.pending + payments.unpaid,
            ),
            description: `${payments.paid} lunas · ${payments.pending} menunggu validasi · ${payments.unpaid} belum dibayar`,
          },
          {
            id: "shipping",
            label: "Pengiriman minggu ini",
            value: progressPercentage(
              shipping.delivered,
              shipping.delivered +
                shipping.inTransit +
                shipping.awaitingDispatch,
            ),
            description: `${shipping.delivered} diterima pembeli · ${shipping.inTransit} dalam perjalanan · ${shipping.awaitingDispatch} belum dikirim`,
          },
          {
            id: "live",
            label: "Live",
            value: progressPercentage(live.completed, live.scheduled),
            description: `${live.completed} / ${live.scheduled} Live terjadwal sudah terlaksana`,
          },
        ]}
      />
      <div className="grid gap-3.5 md:grid-cols-3">
        <ActionCard
          href="/pembayaran/validasi"
          icon={<ModuleIcon module="pembayaran" />}
          title="Validasi pembayaran"
          description={`${payments.pending} menunggu`}
        />
        <ActionCard
          href="/pengiriman/siap-dikirim"
          icon={<ModuleIcon module="pengiriman" />}
          title="Kirim pesanan"
          description={`${data.readyToShip} siap dikirim`}
        />
        <ActionCard
          href="/penjualan/live"
          icon={<ModuleIcon module="penjualan" />}
          title="Publikasikan promosi"
          description={data.draftPromotion}
        />
      </div>
    </div>
  );
}
