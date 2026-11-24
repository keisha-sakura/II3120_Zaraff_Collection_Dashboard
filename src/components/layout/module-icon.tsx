import type { ModuleId } from "@/config/pages";
const paths: Record<ModuleId, string> = {
  beranda: "M3 11l9-7 9 7M5 10v10h14V10",
  gudang: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10",
  penjualan: "M3 12V4h8l10 10-8 8L3 12zM7 8h1",
  pembayaran: "M3 6h18v13H3zM3 9h18M16 13h3",
  pengiriman: "M3 6h11v10H3zM14 10h4l3 3v3h-7M5 18h4M15 18h4",
  laporan: "M4 20V10M10 20V4M16 20v-7M3 20h18",
  pengaturan:
    "M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M9 9h6v6H9z",
  notifikasi: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4",
  auth: "M10 4h10v16H10M3 12h12M11 8l4 4-4 4",
};
export function ModuleIcon({ module }: { module: ModuleId }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[module]} />
    </svg>
  );
}
