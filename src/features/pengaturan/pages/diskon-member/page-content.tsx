"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { useSettings } from "../../components/settings-provider";
export function DiscountPage() {
  const { sales } = useSettings();
  return (
    <DiscountForm
      key={sales.memberDiscountPercent}
      saved={sales.memberDiscountPercent}
    />
  );
}
function DiscountForm({ saved }: { saved: number }) {
  const { run } = useSettings();
  const [value, setValue] = useState(String(saved));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run({ type: "save-discount", percent: Number(value) });
  }
  return (
    <>
      <PageHeader title="Diskon Member" />
      <Card className="max-w-xl">
        <form onSubmit={submit} className="space-y-5">
          <FormField
            id="member-discount"
            label="Diskon untuk member aktif (%)"
            hint="Berlaku untuk pesanan baru. Total pesanan sebelumnya tetap."
          >
            <Input
              id="member-discount"
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-describedby="member-discount-hint"
            />
          </FormField>
          <div className="flex items-center justify-end gap-4">
            <Button variant="text" onClick={() => setValue(String(saved))}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
