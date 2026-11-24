"use client";
import { useState } from "react";
import { roles, roleLabels, type Role } from "@/config/roles";
import { getNavigation } from "@/config/navigation";
import { getPagesForRole } from "@/config/pages";
import { itemStatuses } from "@/config/statuses";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, LocationBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { Progress } from "@/components/ui/progress";
import { GlobalSearch } from "@/components/layout/global-search";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";
import type { InventoryItem } from "@/types/domain";

/** Component catalog only; business pages are built in the next phase. */
export function FoundationPreview({ items }: { items: InventoryItem[] }) {
  const [role, setRole] = useState<Role>("owner");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState("");
  return (
    <main className="mx-auto max-w-(--content-width) space-y-6 p-6 lg:p-10">
      <div className="brand-gradient h-2 rounded-full" />
      <PageHeader
        title="Fondasi Zaraff Collection"
        description="Katalog komponen dan akses role. Halaman operasional akan dibangun per tahap."
        secondaryAction={
          <ButtonLink variant="secondary" href="/api/health">
            Cek API
          </ButtonLink>
        }
      />
      <GlobalSearch key={role} role={role} />
      <Card>
        <h2 className="mb-4 text-lg font-bold">Role dan navigasi</h2>
        <FormField id="preview-role" label="Preview role">
          <Select
            id="preview-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role);
              setSelectedPage("");
            }}
          >
            {roles.map((value) => (
              <option key={value} value={value}>
                {roleLabels[value]}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="mt-4 flex flex-wrap gap-2">
          {getNavigation(role).map((module) => (
            <Badge key={module.id} tone="sold">
              {module.label}
            </Badge>
          ))}
        </div>
        <p className="text-muted mt-3 text-sm">
          {getPagesForRole(role).length} halaman terpetakan. Pilihan role ini
          hanya untuk preview, bukan sesi login.
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">
            Daftar halaman untuk {roleLabels[role]}
          </summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {getPagesForRole(role).map((page) => (
              <li key={page.id} className="text-sm">
                <span className="font-semibold">{page.id}</span> · {page.title}
                {!page.designAvailable && (
                  <span className="text-muted">
                    {" "}
                    · referensi desain belum tersedia
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
        {selectedPage && (
          <p role="status" className="text-primary mt-4 text-sm">
            {selectedPage} — route masih rencana implementasi.
          </p>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Tombol dan dialog</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setDialogOpen(true)}>
              Buka dialog contoh
            </Button>
            <Button variant="text" onClick={() => setSelectedPage("")}>
              Batal
            </Button>
          </div>
          <p className="text-muted mt-4 text-sm">
            Aksi utama satu per halaman, aksi sekunder satu, dan Batal berupa
            teks.
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Status dan kode lokasi</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(itemStatuses).map(([key, status]) => (
              <Badge key={key} tone={status.tone}>
                {status.label}
              </Badge>
            ))}
            <LocationBadge>R01-S03</LocationBadge>
          </div>
        </Card>
      </div>
      <Card>
        <Progress
          label="Contoh progres sortir"
          value={50}
          description="6 / 12 item tersortir"
        />
      </Card>
      <DataTable
        caption="Contoh inventaris dari dummy repository"
        columns={[
          { id: "code", header: "Kode", cell: (item) => item.id },
          { id: "category", header: "Kategori", cell: (item) => item.category },
          { id: "grade", header: "Grade", cell: (item) => item.grade ?? "—" },
          {
            id: "price",
            header: "Harga",
            cell: (item) =>
              item.price === null ? "—" : formatCurrency(item.price),
          },
          {
            id: "status",
            header: "Status",
            cell: (item) => (
              <Badge tone={itemStatuses[item.status].tone}>
                {itemStatuses[item.status].label}
              </Badge>
            ),
          },
          {
            id: "location",
            header: "Lokasi",
            cell: (item) =>
              item.locationId ? (
                <LocationBadge>{item.locationId}</LocationBadge>
              ) : (
                "—"
              ),
          },
        ]}
        rows={items}
        rowKey={(item) => item.id}
      />
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Contoh dialog"
      >
        <FormField
          id="sample-location"
          label="Kode lokasi"
          hint="Contoh input; belum menyimpan data."
        >
          <Input
            id="sample-location"
            aria-describedby="sample-location-hint"
            placeholder="R01-S03"
          />
        </FormField>
        <div className="mt-5">
          <Button variant="text" onClick={() => setDialogOpen(false)}>
            Batal
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
