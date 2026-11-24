"use client";
import { useState, type FormEvent } from "react";
import { executeCommand } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
export function DepositTopUp({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await executeCommand("deposit", {
        type: "top-up",
        customerId,
        amount: Number(values.get("amount")),
        description: String(values.get("description")),
      });
      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Top up belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="secondary"
        className="mt-4"
        onClick={() => setOpen(true)}
      >
        Top up deposit
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Catat top up deposit"
      >
        {open && (
          <form onSubmit={submit} className="space-y-4">
            <FormField id="topup-amount" label="Nominal (Rp)">
              <Input
                id="topup-amount"
                name="amount"
                type="number"
                required
                min={1}
                max={1000000000}
                step={1}
              />
            </FormField>
            <FormField id="topup-description" label="Keterangan">
              <Input
                id="topup-description"
                name="description"
                required
                minLength={3}
                maxLength={200}
                placeholder="Top up transfer pembeli"
              />
            </FormField>
            {error && (
              <Alert tone="danger" title="Top up belum tersimpan">
                {error}
              </Alert>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="text" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                Simpan top up
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
