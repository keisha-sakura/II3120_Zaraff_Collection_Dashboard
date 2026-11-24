"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { LocationBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { FormField, Input } from "@/components/ui/form-field";
import { useSettings } from "../../components/settings-provider";
export function LocationsPage() {
  const { warehouse, run, error } = useSettings();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const result = run({
      type: "add-location",
      code: String(values.get("code")),
      description: String(values.get("description")),
    });
    if (result) {
      setFailed(false);
      setOpen(false);
    } else setFailed(true);
  }
  return (
    <>
      <PageHeader
        title="Lokasi Penyimpanan"
        description="Pengaturan"
        primaryAction={
          <Button
            onClick={() => {
              setFailed(false);
              setOpen(true);
            }}
          >
            Tambah lokasi
          </Button>
        }
      />
      <DataTable
        caption="Lokasi penyimpanan dan jumlah isi saat ini"
        rows={warehouse.locations}
        rowKey={(row) => row.id}
        columns={[
          {
            id: "code",
            header: "Kode",
            cell: (row) => <LocationBadge>{row.code}</LocationBadge>,
          },
          {
            id: "description",
            header: "Keterangan",
            cell: (row) => row.description,
          },
          {
            id: "bales",
            header: "Bale",
            cell: (row) =>
              warehouse.bales.filter(
                (bale) =>
                  bale.locationId === row.id && bale.status !== "sorted",
              ).length,
          },
          {
            id: "items",
            header: "Barang",
            cell: (row) =>
              warehouse.items.filter(
                (item) =>
                  item.locationId === row.id &&
                  !["outbound", "returned", "written-off"].includes(
                    item.status,
                  ),
              ).length,
          },
        ]}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="Tambah lokasi">
        {open && (
          <form onSubmit={submit} className="space-y-5">
            {failed && error && (
              <Alert tone="danger" title="Periksa lokasi kembali">
                {error}
              </Alert>
            )}
            <FormField
              id="location-code"
              label="Kode lokasi"
              hint="Huruf dan angka, dipisah tanda hubung. BL-A01 untuk bale; R03-S01 untuk rak."
            >
              <Input
                id="location-code"
                name="code"
                autoFocus
                required
                maxLength={32}
                placeholder="R03-S01"
                aria-describedby="location-code-hint"
              />
            </FormField>
            <FormField id="location-description" label="Keterangan">
              <Input
                id="location-description"
                name="description"
                required
                maxLength={160}
                placeholder="Rak 3 susun 1 · Celana"
              />
            </FormField>
            <div className="flex justify-end gap-4">
              <Button variant="text" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan lokasi</Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
