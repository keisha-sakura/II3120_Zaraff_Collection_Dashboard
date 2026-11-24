import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  "success" | "warning" | "info" | "sold" | "danger" | "neutral";
const tones: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  sold: "bg-sold-soft text-sold",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-neutral-soft text-neutral",
};
export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
export function LocationBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "border-location-border bg-location-soft text-location inline-flex rounded-md border px-2 py-0.5 font-mono text-xs font-bold whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
