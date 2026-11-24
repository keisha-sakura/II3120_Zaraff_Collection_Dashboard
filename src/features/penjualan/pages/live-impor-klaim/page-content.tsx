"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { formatDate } from "@/lib/format";
import { sampleClaims } from "../../model";
import { parseClaims } from "../../claims";
import { useSales } from "../../components/sales-provider";
import { MissingSalesRecord, SalesLink } from "../../components/shared";
import { ClaimExtraction } from "../../components/claim-extraction";
export function ImportClaimsPage({ id }: { id: string }) {
  const { state, run, go } = useSales();
  const [text, setText] = useState(id === "live-261123" ? sampleClaims : "");
  const [manualOpen, setManualOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  const live = state.lives.find((live) => live.id === id);
  if (!live) return <MissingSalesRecord label="Live" href="/penjualan/live" />;
  if (live.claimsProcessed)
    return (
      <>
        <PageHeader title={live.title} />
        <Alert title="Klaim live ini sudah diproses">
          Pesanan tidak dibuat ulang.
        </Alert>
        <div className="mt-4">
          <SalesLink href={`/penjualan/live/${id}/klaim`}>
            Lihat hasil klaim
          </SalesLink>
        </div>
      </>
    );
  const rows = parseClaims(text);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw new Error("File CSV maksimal 1 MB.");
      setText(await file.text());
      setFileError("");
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "File tidak dapat dibaca.",
      );
    }
    event.target.value = "";
  }
  function manual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const line = `${String(data.get("handle")).trim()},${String(data.get("code")).trim()},${data.get("time")}`;
    setText((value) => `${value.trim()}${value.trim() ? "\n" : ""}${line}`);
    setManualOpen(false);
  }
  async function process() {
    if (await run({ type: "process-claims", liveId: id, text }))
      go(`/penjualan/live/${id}/klaim`);
  }
  return (
    <>
      <PageHeader
        title={live.title}
        description={`${formatDate(live.scheduledAt)} · TikTok Live`}
        primaryAction={
          <Button
            onClick={process}
            disabled={!rows.length || live.status !== "completed"}
          >
            Proses klaim
          </Button>
        }
        secondaryAction={
          <Button variant="secondary" onClick={() => setManualOpen(true)}>
            Tambah manual
          </Button>
        }
      />
      {live.status !== "completed" && (
        <div className="mb-4">
          <Alert tone="warning" title="Live belum selesai">
            Klaim baru dapat diproses setelah sesi selesai.
          </Alert>
        </div>
      )}
      <Card className="mb-6">
        <FormField
          id="claims-input"
          label="Input komentar dari TikTok (handle, kode, waktu)"
          hint="Satu klaim per baris. Waktu HH:MM:SS.mmm dalam WIB; urutan milidetik dipertahankan."
        >
          <Textarea
            id="claims-input"
            maxLength={1000000}
            aria-describedby="claims-input-hint"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-40 font-mono text-sm"
          />
        </FormField>
        <label className="mt-4 block text-sm">
          <span className="text-muted mb-2 block">
            atau unggah file CSV ekspor komentar
          </span>
          <Input
            aria-label="Unggah CSV klaim"
            type="file"
            accept=".csv,text/csv"
            onChange={upload}
          />
        </label>
        {fileError && (
          <p role="alert" className="text-danger mt-3 text-sm">
            {fileError}
          </p>
        )}
        <ClaimExtraction liveId={id} text={text} onExtract={setText} />
      </Card>
      <h2 className="mb-3 text-base font-bold">
        Pratinjau {rows.length} klaim
      </h2>
      <DataTable
        caption="Pratinjau klaim sebelum diproses"
        rows={rows}
        rowKey={(row) => String(row.line)}
        columns={[
          { id: "handle", header: "Pembeli", cell: (row) => row.handle },
          { id: "code", header: "Kode", cell: (row) => row.itemCode },
          {
            id: "time",
            header: "Waktu",
            cell: (row) => (
              <span className="font-mono whitespace-nowrap">{row.time}</span>
            ),
          },
          {
            id: "validation",
            header: "Pemeriksaan format",
            cell: (row) =>
              row.error ? (
                <span className="text-danger">{row.error}</span>
              ) : (
                "Siap diproses"
              ),
          },
        ]}
        emptyMessage="Masukkan komentar atau unggah CSV untuk melihat pratinjau."
      />
      <Dialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Tambah klaim manual"
      >
        <form onSubmit={manual} className="space-y-4">
          <FormField id="manual-handle" label="Handle pembeli">
            <Input
              id="manual-handle"
              name="handle"
              required
              placeholder="@rina.thrift"
            />
          </FormField>
          <FormField id="manual-code" label="Kode barang">
            <Input
              id="manual-code"
              name="code"
              required
              placeholder="ZR-2609-0008"
            />
          </FormField>
          <FormField id="manual-time" label="Waktu komentar (WIB)">
            <Input
              id="manual-time"
              name="time"
              required
              placeholder="19:24:03.120"
              pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button variant="text" onClick={() => setManualOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Tambahkan</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
