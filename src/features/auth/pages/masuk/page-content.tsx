"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // UI preview only: no credentials, tokens, or sessions are persisted.
    const password = event.currentTarget.elements.namedItem("password");
    if (password instanceof HTMLInputElement) password.value = "";
    setShowPassword(false);
    setSubmitted(true);
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
          {submitted && (
            <Alert title="Login belum diaktifkan">
              Untuk mencoba dashboard, buka pratinjau dan pilih role.
            </Alert>
          )}
          <Button type="submit" className="w-full py-3">
            Masuk
          </Button>
          <p className="text-muted text-center text-[13px]">
            Lupa kata sandi? Hubungi Owner.
          </p>
        </form>

        <div className="border-border mt-6 border-t pt-5 text-center">
          <p className="text-muted mb-2 text-xs">
            Dashboard dapat dicoba tanpa login.
          </p>
          <Link
            href="/pratinjau"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Buka pratinjau dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
