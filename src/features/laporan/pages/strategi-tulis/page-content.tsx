"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { monthLabel, validMonth } from "../../model";
import { useReports } from "../../components/reports-provider";
import { ReportsLink, StrategyData } from "../../components/shared";
import { monthOf } from "../../selectors";
export function WriteStrategyPage() {
  const { run, go } = useReports();
  const [month, setMonth] = useState(() => {
    const next = new Date(`${monthOf(new Date().toISOString())}-01T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next.toISOString().slice(0, 7);
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = await run({
      type: "save-strategy",
      month,
      content: String(data.get("content")),
    });
    if (id) go(`/laporan/strategi/${id}/kirim`);
  }
  const previous = validMonth(month)
    ? new Date(`${month}-01T00:00:00Z`)
    : new Date();
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  return (
    <>
      <PageHeader
        title={`Strategi ${validMonth(month) ? monthLabel(month) : "bulanan"}`}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <form onSubmit={submit} className="space-y-5">
            <FormField id="strategy-month" label="Bulan">
              <Input
                id="strategy-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                required
                min="2000-01"
                max="2100-12"
              />
            </FormField>
            <FormField id="strategy-content" label="Isi strategi">
              <Textarea
                id="strategy-content"
                name="content"
                rows={7}
                required
                maxLength={10000}
                placeholder="Tulis arahan berdasarkan data penjualan dan stok di samping."
              />
            </FormField>
            <div className="border-border flex flex-wrap items-center justify-end gap-4 border-t pt-4">
              <ReportsLink href="/laporan/strategi">Batal</ReportsLink>
              <Button type="submit">Simpan dan lanjut kirim</Button>
            </div>
          </form>
        </Card>
        <StrategyData month={previous.toISOString().slice(0, 7)} />
      </div>
    </>
  );
}
