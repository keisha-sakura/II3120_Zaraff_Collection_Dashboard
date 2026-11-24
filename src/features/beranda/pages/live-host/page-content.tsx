import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardLink } from "@/components/layout/dashboard-link";
import { formatDate } from "@/lib/format";
import { ProgressSection } from "../../components/progress-section";
import { OwnerNotes } from "../../components/owner-notes";
import { progressPercentage, type HostHomeData } from "../../contracts";
export function HostHomePage({ data }: { data: HostHomeData }) {
  return (
    <div className="space-y-4">
      <ProgressSection
        title="Progres live bulan ini"
        headingId="host-progress-heading"
        items={[
          {
            id: "live",
            label: "Live yang ditugaskan",
            value: progressPercentage(data.completedLives, data.scheduledLives),
            description: `${data.completedLives} / ${data.scheduledLives} live sudah terlaksana`,
          },
        ]}
      />
      <Card aria-labelledby="host-schedule-heading" className="px-5 py-4.5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="host-schedule-heading"
            className="text-primary text-base font-bold"
          >
            Jadwal live berikutnya
          </h2>
          <DashboardLink
            href="/penjualan/live"
            className="text-primary text-[13px] font-semibold hover:underline"
          >
            Lihat jadwal live
          </DashboardLink>
        </div>
        {data.upcoming.length ? (
          <ul className="divide-border-subtle divide-y">
            {data.upcoming.map((live) => (
              <li
                key={live.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-bold">{live.title}</p>
                  <p className="text-muted mt-1 text-[13px]">
                    <time dateTime={live.scheduledAt}>
                      {formatDate(live.scheduledAt, true)} WIB
                    </time>{" "}
                    · {live.platform} · {live.itemIds.length} barang
                  </p>
                </div>
                <Badge
                  tone={live.status === "published" ? "success" : "neutral"}
                >
                  {live.status === "published" ? "Dipublikasikan" : "Draf"}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Belum ada jadwal live"
            description="Jadwal yang ditugaskan kepadamu akan muncul di sini."
          />
        )}
      </Card>
      <OwnerNotes note={data.note} />
    </div>
  );
}
