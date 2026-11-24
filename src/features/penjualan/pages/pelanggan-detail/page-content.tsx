"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CustomerInput } from "../../model";
import { useSales } from "../../components/sales-provider";
import { CustomerForm } from "../../components/customer-form";
import { MissingSalesRecord, SalesLink } from "../../components/shared";
export function CustomerDetailPage({ id }: { id: string }) {
  const { state, run } = useSales();
  const [saved, setSaved] = useState(false);
  const customer = state.customers.find((customer) => customer.id === id);
  if (!customer)
    return <MissingSalesRecord label="Pelanggan" href="/penjualan/pelanggan" />;
  function save(input: CustomerInput) {
    if (run({ type: "update-customer", customerId: id, input })) setSaved(true);
  }
  const joined = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(customer.joinedAt));
  return (
    <>
      <PageHeader
        title={customer.name}
        description={`${customer.handle} · pelanggan sejak ${joined}`}
      />
      {saved && (
        <div className="mb-4">
          <Alert
            tone="success"
            title="Perubahan pelanggan berhasil disimpan."
          />
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <CustomerForm
            initial={customer}
            onSubmit={save}
            cancel={<SalesLink href="/penjualan/pelanggan">Batal</SalesLink>}
          />
        </Card>
        <div>
          <Card className="mb-4">
            <h2 className="text-muted text-sm">Saldo deposit</h2>
            <p className="mt-2 text-3xl font-extrabold">
              {formatCurrency(customer.depositBalance)}
            </p>
          </Card>
          <DataTable
            caption={`Riwayat deposit ${customer.name}`}
            rows={state.deposits.filter((entry) => entry.customerId === id)}
            rowKey={(entry) => entry.id}
            columns={[
              {
                id: "date",
                header: "Tanggal",
                cell: (entry) => formatDate(entry.occurredAt),
              },
              {
                id: "description",
                header: "Keterangan",
                cell: (entry) => entry.description,
              },
              {
                id: "amount",
                header: "Nominal",
                cell: (entry) =>
                  `${entry.amount < 0 ? "−" : "+"}${formatCurrency(Math.abs(entry.amount))}`,
              },
            ]}
            emptyMessage="Belum ada riwayat deposit."
          />
        </div>
      </div>
    </>
  );
}
