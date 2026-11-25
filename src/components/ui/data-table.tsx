"use client";
import {
  DashboardLink,
  useDashboardNavigation,
} from "@/components/layout/dashboard-link";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./empty-state";

export type TableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Render controls outside the row link so they retain their own click target. */
  interactive?: boolean;
};
function RowArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-muted group-hover:text-primary group-focus-within:text-primary pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 transition-[color,translate] group-focus-within:translate-x-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowHref,
  beforeRowNavigate,
  emptyMessage,
}: {
  caption: string;
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Mark cells containing controls as interactive. */
  rowHref?: (row: T) => string;
  beforeRowNavigate?: (row: T) => boolean | void | Promise<boolean | void>;
  emptyMessage?: string;
}) {
  const navigation = useDashboardNavigation();
  return (
    <div className="rounded-card border-border bg-surface overflow-x-auto border">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-table-header text-surface">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  "px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap",
                  column.className,
                  rowHref && index === columns.length - 1 && "pr-12",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            async function navigateRow(event: MouseEvent<HTMLAnchorElement>) {
              if (
                href &&
                beforeRowNavigate &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                if ((await beforeRowNavigate(row)) !== false) {
                  if (navigation) navigation.navigate(href);
                  else window.location.assign(href);
                }
              }
            }
            return (
              <tr
                key={rowKey(row)}
                className={cn(
                  "group border-border-subtle border-b last:border-0",
                  href && "hover:bg-sidebar focus-within:bg-sidebar",
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={column.id}
                    className={cn(
                      "relative px-3.5 py-3 align-middle",
                      column.className,
                      href && index === columns.length - 1 && "pr-12",
                    )}
                  >
                    {href && !column.interactive ? (
                      <DashboardLink
                        href={href}
                        onClick={navigateRow}
                        tabIndex={index === 0 ? 0 : -1}
                        aria-label={
                          index === 0 ? `Buka detail ${rowKey(row)}` : undefined
                        }
                        className="block before:absolute before:inset-0"
                      >
                        {column.cell(row)}
                        {index === columns.length - 1 && <RowArrow />}
                      </DashboardLink>
                    ) : (
                      column.cell(row)
                    )}
                    {href &&
                      column.interactive &&
                      index === columns.length - 1 && (
                        <DashboardLink
                          href={href}
                          onClick={navigateRow}
                          aria-label={`Buka detail ${rowKey(row)}`}
                          className="focus-visible:ring-primary absolute inset-y-0 right-0 w-12 rounded-sm focus-visible:ring-2 focus-visible:ring-inset"
                        >
                          <RowArrow />
                        </DashboardLink>
                      )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <EmptyState description={emptyMessage} />}
    </div>
  );
}
