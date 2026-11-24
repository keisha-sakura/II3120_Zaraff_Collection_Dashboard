"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { categories, conditions } from "../../model";
import { nextWarehouseCode } from "../../operations";
import { useWarehouse } from "../../components/warehouse-provider";
import {
  CancelLink,
  ItemStatusBadge,
  MissingRecord,
} from "../../components/shared";
import type { ItemCategory } from "@/types/domain";
export function SortItemPage({
  id,
  initialReturn = false,
}: {
  id: string;
  initialReturn?: boolean;
}) {
  const { state, run, go } = useWarehouse();
  const [category, setCategory] = useState<ItemCategory>("Kaos");
  const [condition, setCondition] = useState<string>(
    initialReturn ? conditions[3] : conditions[1],
  );
  const [outcome, setOutcome] = useState<"laundry" | "return">(
    initialReturn ? "return" : "laundry",
  );
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const bale = state.bales.find((bale) => bale.id === id);
  if (!bale) return <MissingRecord kind="Bale" href="/gudang/bale" />;
  if (bale.status !== "sorting")
    return (
      <>
        <PageHeader title={`Sortir bale ${id}`} />
        <Alert
          title={
            bale.status === "sorted"
              ? "Sortir bale sudah selesai"
              : "Mulai sortir terlebih dahulu"
          }
        >
          Buka detail bale untuk melanjutkan proses yang sesuai.
        </Alert>
        <CancelLink href={`/gudang/bale/${id}`}>
          Kembali ke detail bale
        </CancelLink>
      </>
    );
  const items = state.items.filter((item) => item.baleId === id);
  const returns = state.returns.filter((item) => item.baleId === id);
  const records = [
    ...items.map((item) => ({
      id: item.id,
      category: item.category,
      status: <ItemStatusBadge status={item.status} />,
    })),
    ...returns.map((item) => ({
      id: item.id,
      category: item.category,
      status: <Badge tone="danger">Diretur</Badge>,
    })),
  ].sort((a, b) => b.id.localeCompare(a.id));
  const nextId = nextWarehouseCode(
    outcome === "laundry" ? "ZR" : "RT",
    outcome === "laundry"
      ? state.items.map((item) => item.id)
      : state.returns.map((item) => item.id),
    new Date().toISOString(),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const savedId = await run({
      type: "record-item",
      input: { baleId: id, category, condition, outcome, reason },
    });
    if (savedId) {
      setSuccess(
        outcome === "laundry"
          ? `Kode ${savedId} dibuat, barang dikirim ke laundry.`
          : `Retur ${savedId} tercatat untuk supplier.`,
      );
      setReason("");
    }
  }
  async function finish() {
    if (await run({ type: "finish-sort", baleId: id })) {
      setConfirmOpen(false);
      go(`/gudang/bale/${id}`);
    }
  }
  return (
    <>
      <PageHeader
        title={`Sortir bale ${id}`}
        secondaryAction={
          <Button
            variant="secondary"
            disabled={!records.length}
            title={
              !records.length
                ? "Catat minimal satu item atau retur terlebih dahulu"
                : undefined
            }
            onClick={() => setConfirmOpen(true)}
          >
            Selesai sortir
          </Button>
        }
      />
      {success && (
        <div className="mb-4">
          <Alert tone="success" title={success} />
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
        <Card>
          <form onSubmit={submit} className="space-y-5">
            <FormField id="sort-category" label="Kategori">
              <Select
                id="sort-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ItemCategory)
                }
              >
                {categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </FormField>
            <FormField id="sort-condition" label="Kondisi (checklist grading)">
              <Select
                id="sort-condition"
                value={condition}
                onChange={(event) => {
                  setCondition(event.target.value);
                  if (event.target.value.startsWith("Tidak Layak"))
                    setOutcome("return");
                }}
              >
                {conditions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </FormField>
            <fieldset className="space-y-3">
              <legend className="mb-3 font-semibold">Hasil pemeriksaan</legend>
              <label className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="outcome"
                  value="laundry"
                  checked={outcome === "laundry"}
                  onChange={() => setOutcome("laundry")}
                  className="accent-primary mt-1 size-4 shrink-0"
                />
                <span>Layak jual: beri kode unik dan kirim ke laundry</span>
              </label>
              <label className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="outcome"
                  value="return"
                  checked={outcome === "return"}
                  onChange={() => setOutcome("return")}
                  className="accent-primary mt-1 size-4 shrink-0"
                />
                <span>Tidak layak: retur ke supplier</span>
              </label>
            </fieldset>
            {outcome === "return" && (
              <FormField id="return-reason" label="Alasan retur">
                <Input
                  id="return-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Contoh: Bolong di bagian ketiak"
                  required
                  maxLength={300}
                />
              </FormField>
            )}
            <p className="text-muted text-sm">
              Kode item:{" "}
              <span className="text-foreground font-mono font-semibold">
                {nextId}
              </span>
            </p>
            <Button type="submit">
              {outcome === "return" ? "Simpan retur" : "Simpan item"}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-bold">Tercatat dari bale ini</h2>
          {records.length ? (
            <ul className="divide-border-subtle divide-y">
              {records.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span>
                    <span className="block font-semibold">{item.id}</span>
                    <span className="text-muted text-[13px]">
                      {item.category}
                    </span>
                  </span>
                  {item.status}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Belum ada item tercatat"
              description="Hasil sortir akan muncul di sini."
            />
          )}
        </Card>
      </div>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Selesaikan sortir ${id}`}
      >
        <p className="text-muted leading-6">
          Tercatat{" "}
          <strong className="text-foreground">{items.length} stok</strong> dan{" "}
          <strong className="text-foreground">{returns.length} retur</strong>.
          Status bale menjadi Selesai Disortir dan lokasi{" "}
          {bale.locationId ?? "—"} dilepas.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="text" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button onClick={finish}>Selesai sortir</Button>
        </div>
      </Dialog>
    </>
  );
}
