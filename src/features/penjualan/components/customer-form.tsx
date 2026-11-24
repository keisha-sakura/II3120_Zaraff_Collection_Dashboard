"use client";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Checkbox } from "@/components/ui/form-field";
import type { CustomerInput, SalesCustomer } from "../model";
import { useSales } from "./sales-provider";
export function CustomerForm({
  initial,
  onSubmit,
  cancel,
  submitLabel = "Simpan perubahan",
  showError = false,
}: {
  initial?: SalesCustomer;
  onSubmit: (input: CustomerInput) => void;
  cancel: ReactNode;
  submitLabel?: string;
  showError?: boolean;
}) {
  const { error } = useSales();
  const prefix = initial?.id ?? "new-customer";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    onSubmit({
      name: String(values.get("name")),
      handle: String(values.get("handle")),
      phone: String(values.get("phone")),
      isMember: values.get("member") === "on",
    });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {showError && error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <FormField id={`${prefix}-name`} label="Nama">
        <Input
          id={`${prefix}-name`}
          name="name"
          defaultValue={initial?.name}
          required
          minLength={2}
          maxLength={100}
        />
      </FormField>
      <FormField id={`${prefix}-handle`} label="Handle media sosial">
        <Input
          id={`${prefix}-handle`}
          name="handle"
          defaultValue={initial?.handle}
          placeholder="@nama.pelanggan"
          required
          maxLength={31}
        />
      </FormField>
      <FormField id={`${prefix}-phone`} label="Kontak WhatsApp">
        <Input
          id={`${prefix}-phone`}
          name="phone"
          type="tel"
          defaultValue={initial?.phone}
          required
          maxLength={22}
        />
      </FormField>
      <Checkbox
        label="Member aktif"
        name="member"
        defaultChecked={initial?.isMember ?? false}
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {cancel}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
