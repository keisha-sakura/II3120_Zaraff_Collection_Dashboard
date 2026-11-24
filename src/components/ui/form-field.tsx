import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("control", className)} {...props} />;
}

export function Checkbox({
  label,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        className={cn("accent-primary mt-1 size-4 shrink-0", className)}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("control", className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn("control min-h-32 resize-y", className)}
      {...props}
    />
  );
}
export function FilterSelect({
  label,
  children,
  className,
  ...props
}: ComponentProps<"select"> & { label: string }) {
  return (
    <label className="border-border-control bg-surface inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm">
      <span className="text-muted">{label}:</span>
      <select
        className={cn("min-w-0 bg-transparent font-semibold", className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
