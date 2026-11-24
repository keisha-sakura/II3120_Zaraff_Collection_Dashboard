import { notFound } from "next/navigation";
import { requirePage } from "./auth.ts";
import { loadWorkspace } from "./workspace.ts";
import { database } from "./db.ts";
import type { PageId } from "../config/pages";
export async function requireRecord(page: PageId, id?: string) {
  const user = await requirePage(page);
  if (!id) return user;
  const state = loadWorkspace(database(), user.id);
  const exists = ["G03", "G04", "G05"].includes(page)
    ? state.warehouse.bales.some((row) => row.id === id)
    : ["G08", "G10"].includes(page)
      ? state.warehouse.items.some((row) => row.id === id)
      : ["P05", "P06", "P11"].includes(page)
        ? state.sales.lives.some(
            (row) =>
              row.id === id &&
              (user.role !== "live-host" || row.hostId === user.id),
          )
        : page === "P08" || page === "D04"
          ? state.sales.orders.some((row) => row.id === id)
          : page === "D02"
            ? state.sales.orders.some(
                (row) =>
                  row.id === id &&
                  (user.role !== "packing" || row.paymentStatus === "approved"),
              )
            : page === "P10"
              ? state.sales.customers.some((row) => row.id === id)
              : page === "Y06"
                ? state.payments.invoices.some((row) => row.id === id)
                : ["Y02", "Y03"].includes(page)
                  ? state.payments.attempts.some((row) => row.id === id)
                  : page === "R07"
                    ? state.reports.strategies.some((row) => row.id === id)
                    : true;
  if (!exists) notFound();
  return user;
}
