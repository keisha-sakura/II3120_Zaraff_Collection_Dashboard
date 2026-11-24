"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardLink } from "@/components/layout/dashboard-link";
import { FilterSelect } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { formatCurrency } from "@/lib/format";
import { monthLabel } from "../model";
import { monthOf, reportData } from "../selectors";
import { daysSince } from "@/features/gudang/model";
import { useReports } from "./reports-provider";
export function ReportsLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <DashboardLink
      href={href}
      className={
        primary
          ? "bg-primary text-surface hover:bg-primary-hover rounded-control inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold"
          : "text-primary text-sm font-semibold hover:underline"
      }
    >
      {children}
    </DashboardLink>
  );
}
export function MonthFilter({ label = "Periode" }: { label?: string }) {
  const { warehouse, month, go } = useReports();
  const pathname = usePathname();
  const months = [
    ...new Set([
      month,
      ...warehouse.items.flatMap((item) =>
        [item.availableAt, item.soldAt, item.outboundAt]
          .filter((date): date is string => !!date)
          .map(monthOf),
      ),
      ...warehouse.returns.map((row) => monthOf(row.createdAt)),
    ]),
  ]
    .sort()
    .reverse();
  return (
    <div className="mb-4">
      <FilterSelect
        label={label}
        aria-label={label}
        value={month}
        onChange={(event) => go(`${pathname}?month=${event.target.value}`)}
      >
        {months.map((value) => (
          <option key={value} value={value}>
            {monthLabel(value)}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}
export function StrategyData({ month }: { month: string }) {
  const { warehouse, sales } = useReports();
  const data = reportData(warehouse, sales, month);
  const best = [...data.categories].sort((a, b) => b.count - a.count)[0];
  return (
    <Card>
      <h2 className="mb-5 font-bold">Data {monthLabel(month)}</h2>
      <DetailList
        entries={[
          { label: "Barang terjual", value: data.sold.length },
          { label: "Pendapatan", value: formatCurrency(data.revenue) },
          { label: "Retur", value: data.returns },
          {
            label: "Terlaris",
            value: best ? `${best.category} (${best.count})` : "—",
          },
          {
            label: "Stok > 60 hari",
            value: warehouse.items.filter(
              (item) =>
                item.status === "available" &&
                item.availableAt &&
                daysSince(item.availableAt) > 60,
            ).length,
          },
          {
            label: "Bale belum dibuka",
            value: warehouse.bales.filter((bale) => bale.status === "stored")
              .length,
          },
        ]}
      />
      <p className="text-muted mt-4 text-xs">
        Data operasional tersimpan. Umur stok dan bale memakai posisi saat ini.
      </p>
    </Card>
  );
}
