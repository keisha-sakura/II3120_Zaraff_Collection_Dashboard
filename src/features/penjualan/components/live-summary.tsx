import { DetailList } from "@/components/ui/detail-list";
import { formatCurrency, formatDate } from "@/lib/format";
import type { WarehouseItem } from "@/features/gudang/model";
import type { LiveContent } from "../model";

export function LiveSummary({
  live,
  items,
  hostName,
}: {
  live: LiveContent;
  items: readonly WarehouseItem[];
  hostName: string;
}) {
  const prices = items.flatMap((item) =>
    item.price === null ? [] : [item.price],
  );
  return (
    <DetailList
      entries={[
        { label: "Judul", value: live.title },
        {
          label: "Jadwal",
          value: `${formatDate(live.scheduledAt, true)} WIB · TikTok Live`,
        },
        { label: "Host", value: hostName },
        {
          label: "Kanal promosi",
          value: live.promotionChannels.join(", ") || "—",
        },
        {
          label: "Barang",
          value: `${items.length} barang${prices.length ? ` · ${formatCurrency(Math.min(...prices))} – ${formatCurrency(Math.max(...prices))}` : ""}`,
        },
        {
          label: "Isi promosi",
          value: (
            <p className="break-words whitespace-pre-line">{live.content}</p>
          ),
        },
      ]}
    />
  );
}
