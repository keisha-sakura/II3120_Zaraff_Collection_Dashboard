import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-card border-border bg-surface border p-5",
        className,
      )}
      {...props}
    />
  );
}
export function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <h2 className="text-muted text-sm">{label}</h2>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
      {description && <p className="text-muted mt-1 text-xs">{description}</p>}
    </Card>
  );
}
