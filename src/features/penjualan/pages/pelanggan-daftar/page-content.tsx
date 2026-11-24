"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/form-field";
import { SearchInput } from "@/components/ui/search-input";
import { formatCurrency } from "@/lib/format";
import type { CustomerInput } from "../../model";
import { useSales } from "../../components/sales-provider";
import { CustomerForm } from "../../components/customer-form";
export function CustomersPage() {
  const { state, run, go } = useSales();
  const [member, setMember] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rows = state.customers.filter(
    (customer) =>
      (member === "all" || customer.isMember === (member === "active")) &&
      `${customer.name} ${customer.handle}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function create(input: CustomerInput) {
    const id = run({ type: "add-customer", input });
    if (id) {
      setOpen(false);
      go(`/penjualan/pelanggan/${id}`);
    }
  }
  return (
    <>
      <PageHeader
        title="Pelanggan dan Member"
        primaryAction={
          <Button onClick={() => setOpen(true)}>Tambah pelanggan</Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <FilterSelect
          label="Member"
          value={member}
          onChange={(event) => setMember(event.target.value)}
        >
          <option value="all">Semua</option>
          <option value="active">Member aktif</option>
          <option value="inactive">Bukan member</option>
        </FilterSelect>
        <div className="w-full sm:w-72">
          <SearchInput
            aria-label="Cari pelanggan"
            placeholder="Cari nama atau handle"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      <DataTable
        caption="Daftar pelanggan dan member"
        rows={rows}
        rowKey={(customer) => customer.id}
        rowHref={(customer) => `/penjualan/pelanggan/${customer.id}`}
        columns={[
          {
            id: "name",
            header: "Nama",
            cell: (customer) => (
              <span className="font-semibold">{customer.name}</span>
            ),
          },
          {
            id: "handle",
            header: "Handle",
            cell: (customer) => customer.handle,
          },
          {
            id: "phone",
            header: "Kontak",
            cell: (customer) => customer.phone || "Belum dilengkapi",
          },
          {
            id: "member",
            header: "Member",
            cell: (customer) =>
              customer.isMember ? (
                <Badge tone="success">Member aktif</Badge>
              ) : (
                "—"
              ),
          },
          {
            id: "deposit",
            header: "Saldo deposit",
            cell: (customer) => formatCurrency(customer.depositBalance),
          },
          {
            id: "orders",
            header: "Pesanan",
            cell: (customer) =>
              state.orders.filter((order) => order.customerId === customer.id)
                .length,
          },
        ]}
        emptyMessage="Tidak ada pelanggan yang sesuai pencarian atau filter."
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah pelanggan"
      >
        <CustomerForm
          key={open ? "open" : "closed"}
          onSubmit={create}
          submitLabel="Simpan pelanggan"
          showError
          cancel={
            <Button variant="text" onClick={() => setOpen(false)}>
              Batal
            </Button>
          }
        />
      </Dialog>
    </>
  );
}
