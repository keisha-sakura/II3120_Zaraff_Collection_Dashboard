"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DetailList } from "@/components/ui/detail-list";
import { FormField, Select, Input, Checkbox } from "@/components/ui/form-field";
import { formatCurrency, formatDate } from "@/lib/format";
import { mockPriceRules } from "@/mocks/data/warehouse-demo";
import type { Grade } from "@/types/domain";
import { recommendedGrade, daysSince, type WarehouseItem } from "../../model";
import { useWarehouse } from "../../components/warehouse-provider";
import { CancelLink, MissingRecord } from "../../components/shared";
export function GradingPage({ id }: { id: string }) {
  const { state } = useWarehouse();
  const item = state.items.find((item) => item.id === id);
  if (!item) return <MissingRecord kind="Barang" href="/gudang/laundry" />;
  if (item.status !== "laundry")
    return (
      <>
        <PageHeader title={`Grading ${id}`} />
        <Alert title="Barang ini sudah selesai grading">
          Lihat status dan lokasi terbaru di inventaris.
        </Alert>
        <CancelLink href={`/gudang/inventaris/${id}`}>
          Lihat detail barang
        </CancelLink>
      </>
    );
  return <GradingForm key={id} item={item} />;
}
function GradingForm({ item }: { item: WarehouseItem }) {
  const { state, run, go } = useWarehouse();
  const suggested = recommendedGrade(item.condition);
  const [grade, setGrade] = useState<Grade>(suggested);
  const [price, setPrice] = useState(
    String(mockPriceRules[item.category][suggested]),
  );
  const [clean, setClean] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (
      run({
        type: "grade",
        itemId: item.id,
        grade,
        price: Number(price),
        confirmedClean: clean,
        locationId: String(values.get("location")),
      })
    )
      go(`/gudang/inventaris/${item.id}`);
  }
  return (
    <>
      <PageHeader
        title={`Grading ${item.category} | ${item.id}`}
        description={item.baleId}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <form onSubmit={submit} className="space-y-5">
            <Alert
              title={`Rekomendasi dari aturan harga: grade ${suggested} · ${formatCurrency(mockPriceRules[item.category][suggested])}`}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="grade-final" label="Grade final">
                <Select
                  id="grade-final"
                  value={grade}
                  onChange={(event) => {
                    const value = event.target.value as Grade;
                    setGrade(value);
                    setPrice(String(mockPriceRules[item.category][value]));
                  }}
                >
                  {["A", "B", "C"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              </FormField>
              <FormField id="grade-price" label="Harga final (Rp)">
                <Input
                  id="grade-price"
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </FormField>
            </div>
            <FormField id="grade-location" label="Lokasi rak">
              <Select
                id="grade-location"
                name="location"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih lokasi rak
                </option>
                {state.locations
                  .filter((location) => location.kind === "rack")
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.code} · {location.description}
                    </option>
                  ))}
              </Select>
            </FormField>
            <Checkbox
              label="Barang sudah kembali dari laundry dan bersih"
              checked={clean}
              onChange={(event) => setClean(event.target.checked)}
              required
            />
            <div className="flex flex-wrap items-center justify-end gap-4">
              <CancelLink href="/gudang/laundry" />
              <Button type="submit">Simpan sebagai Tersedia</Button>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-5 text-base font-bold">Data sortir</h2>
          <DetailList
            entries={[
              { label: "Kategori", value: item.category },
              { label: "Kondisi", value: item.condition },
              {
                label: "Disortir",
                value: `${formatDate(item.sortedAt)} · ${item.sortedBy}`,
              },
              {
                label: "Di laundry",
                value: `${daysSince(item.laundryAt ?? item.sortedAt)} hari`,
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
