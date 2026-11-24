"use client";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { CancelLink } from "../../components/shared";
import { useWarehouse } from "../../components/warehouse-provider";
export function ReceiveBalePage() {
  const { state, run, go } = useWarehouse();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const id = run({
      type: "receive",
      input: {
        supplier: String(values.get("supplier")),
        category: String(values.get("category")),
        weightKg: Number(values.get("weight")),
        estimatedItems: Number(values.get("estimated")),
        receivedAt: `${values.get("received")}T00:00:00+07:00`,
        locationId: String(values.get("location")),
      },
    });
    if (id) go(`/gudang/bale/${id}`);
  }
  return (
    <>
      <PageHeader title="Terima bale baru" />
      <Card className="max-w-3xl">
        <form onSubmit={submit} className="space-y-5">
          <FormField id="supplier" label="Supplier">
            <Select id="supplier" name="supplier" required defaultValue="">
              <option value="" disabled>
                Pilih supplier
              </option>
              {[...new Set(state.bales.map((bale) => bale.supplier))].map(
                (supplier) => (
                  <option key={supplier}>{supplier}</option>
                ),
              )}
            </Select>
          </FormField>
          <FormField id="bale-category" label="Jenis bale">
            <Input
              id="bale-category"
              name="category"
              placeholder="Contoh: Celana Jeans"
              required
              maxLength={100}
            />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="bale-weight" label="Berat (kg)">
              <Input
                id="bale-weight"
                name="weight"
                type="number"
                min="0.1"
                step="0.1"
                required
              />
            </FormField>
            <FormField id="bale-estimated" label="Perkiraan jumlah item">
              <Input
                id="bale-estimated"
                name="estimated"
                type="number"
                min="1"
                step="1"
                required
              />
            </FormField>
          </div>
          <FormField id="bale-received" label="Tanggal diterima">
            <Input
              id="bale-received"
              name="received"
              type="date"
              defaultValue={today}
              max={today}
              required
            />
          </FormField>
          <FormField id="bale-location" label="Lokasi penyimpanan">
            <Select id="bale-location" name="location" required defaultValue="">
              <option value="" disabled>
                Pilih area bale
              </option>
              {state.locations
                .filter((location) => location.kind === "bale")
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} · {location.description}
                  </option>
                ))}
            </Select>
          </FormField>
          <div className="flex items-center justify-end gap-4">
            <CancelLink href="/gudang/bale" />
            <Button type="submit">Simpan bale</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
