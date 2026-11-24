"use client";

import { useRouter } from "next/navigation";
import { clearWorkspace } from "@/lib/workspace-store";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Zaraff-Request": "1",
        },
        body: JSON.stringify({
          username: values.get("username"),
          password: values.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Login belum berhasil.");
      clearWorkspace();
      router.replace("/beranda");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      const password = form.elements.namedItem("password");
      if (password instanceof HTMLInputElement) password.value = "";
      setShowPassword(false);
      setPending(false);
    }
  }

  return (
    <main className="relative isolate grid min-h-dvh place-items-center px-5 py-12">
      <div
        aria-hidden="true"
        className="brand-gradient absolute inset-x-0 top-0 -z-10 h-64 sm:h-95"
      />
      <Card className="w-full max-w-lg rounded-[18px] p-6 shadow-(--shadow-dialog) sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="brand-gradient text-surface grid size-11 shrink-0 place-items-center rounded-xl text-xl font-extrabold"
          >
            Z
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold">Zaraff Collection</h1>
            <p className="text-muted mt-0.5 text-sm">
              Dashboard Operasional Penjual
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4"
          aria-label="Masuk ke dashboard"
        >
          <FormField id="login-username" label="Nama pengguna">
            <Input
              id="login-username"
              name="username"
              autoComplete="username"
              placeholder="Masukkan nama pengguna"
              required
              pattern=".*\S.*"
            />
          </FormField>
          <FormField id="login-password" label="Kata sandi">
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                required
                className="pr-12"
              />
              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted hover:text-primary rounded-control absolute inset-y-1 right-1 grid w-10 place-items-center"
              >
                <svg
                  aria-hidden="true"
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="m3 3 18 18" />}
                </svg>
              </button>
            </div>
          </FormField>
          {error && (
            <Alert tone="danger" title="Tidak dapat masuk">
              {error}
            </Alert>
          )}
          <Button type="submit" disabled={pending} className="w-full py-3">
            {pending ? "Memeriksa…" : "Masuk"}
          </Button>
          <p className="text-muted text-center text-[13px]">
            Lupa kata sandi? Hubungi Owner.
          </p>
        </form>
      </Card>
    </main>
  );
}
