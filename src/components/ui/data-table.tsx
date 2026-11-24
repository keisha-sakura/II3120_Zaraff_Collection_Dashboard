"use client";
import {
  DashboardLink,
  useDashboardNavigation,
} from "@/components/layout/dashboard-link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./empty-state";

export type TableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};
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
  /** Linked rows must contain non-interactive cells; use selection tables separately. */
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
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  "px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap",
                  column.className,
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
                    )}
                  >
                    {href ? (
                      <DashboardLink
                        href={href}
                        onClick={async (event) => {
                          if (
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
                        }}
                        tabIndex={index === 0 ? 0 : -1}
                        aria-label={
                          index === 0 ? `Buka detail ${rowKey(row)}` : undefined
                        }
                        className="block before:absolute before:inset-0"
                      >
                        {column.cell(row)}
                      </DashboardLink>
                    ) : (
                      column.cell(row)
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
