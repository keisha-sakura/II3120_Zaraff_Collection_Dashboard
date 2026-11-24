"use client";
import { useState } from "react";
import { Input } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
export function ClaimExtraction({
  liveId,
  text,
  onExtract,
}: {
  liveId: string;
  text: string;
  onExtract: (text: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  async function extract() {
    setBusy(true);
    setError("");
    try {
      let uploadId: string | undefined;
      if (file) {
        if (file.size > 4 * 1024 * 1024)
          throw new Error("Gambar maksimal 4 MB.");
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/uploads", {
          method: "POST",
          headers: { "X-Zaraff-Request": "1" },
          body: form,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        uploadId = data.id;
      }
      const response = await fetch("/api/claims/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Zaraff-Request": "1",
        },
        body: JSON.stringify({
          liveId,
          ...(uploadId ? { uploadId } : { text }),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onExtract(result.text);
      setReview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ekstraksi gagal.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-border mt-5 space-y-3 border-t pt-4">
      <p className="text-sm font-semibold">
        Baca screenshot atau komentar dengan Gemini (opsional)
      </p>
      <Input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Screenshot komentar"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Button
        variant="text"
        disabled={busy || (!file && !text.trim())}
        onClick={extract}
      >
        {busy ? "Membaca komentar…" : "Ekstrak komentar"}
      </Button>
      {error && (
        <Alert tone="warning" title="Ekstraksi belum tersedia">
          {error}
        </Alert>
      )}
      {review && (
        <Alert tone="warning" title="Periksa hasil ekstraksi">
          Pastikan handle, kode, dan waktu sesuai sumber sebelum Proses klaim.
          Waktu ambigu dibiarkan kosong agar tidak menjadi pemenang.
        </Alert>
      )}
    </div>
  );
}
