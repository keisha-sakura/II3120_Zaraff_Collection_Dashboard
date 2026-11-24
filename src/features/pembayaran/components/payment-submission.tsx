"use client";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { usePayments } from "./payments-provider";
export function PaymentSubmission({
  orderId,
  total,
}: {
  orderId: string;
  total: number;
}) {
  const { run, go } = usePayments();
  const [method, setMethod] = useState<"transfer" | "deposit">("deposit");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      let proofId: string | undefined;
      if (method === "transfer") {
        const file = values.get("proof");
        if (!(file instanceof File) || !file.size)
          throw new Error("Pilih bukti transfer.");
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/uploads", {
          method: "POST",
          headers: { "X-Zaraff-Request": "1" },
          body: form,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        proofId = result.id;
      }
      const id = await run({
        type: "submit",
        orderId,
        method,
        amount: Number(values.get("amount")),
        ...(proofId ? { proofId } : {}),
      });
      if (id) go(`/pembayaran/validasi/${id}/${method}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Pembayaran belum diajukan.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="mt-5 max-w-2xl">
      <h2 className="mb-4 font-bold">Catat pembayaran pembeli</h2>
      <form onSubmit={submit} className="space-y-4">
        <FormField id="submit-payment-method" label="Metode">
          <Select
            id="submit-payment-method"
            value={method}
            onChange={(event) => setMethod(event.target.value as typeof method)}
          >
            <option value="deposit">Deposit</option>
            <option value="transfer">Transfer</option>
          </Select>
        </FormField>
        <FormField id="submit-payment-amount" label="Nominal pembayaran (Rp)">
          <Input
            id="submit-payment-amount"
            name="amount"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={total}
          />
        </FormField>
        {method === "transfer" && (
          <FormField id="submit-payment-proof" label="Bukti transfer">
            <Input
              id="submit-payment-proof"
              name="proof"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
            />
          </FormField>
        )}
        {error && (
          <Alert tone="danger" title="Periksa pembayaran">
            {error}
          </Alert>
        )}
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? "Menyimpan…" : "Ajukan pembayaran"}
        </Button>
      </form>
    </Card>
  );
}
