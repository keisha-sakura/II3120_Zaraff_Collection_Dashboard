import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "text";
const variants: Record<Variant, string> = {
  primary:
    "border-primary bg-primary text-surface hover:border-primary-hover hover:bg-primary-hover",
  secondary: "border-border-secondary bg-surface text-primary hover:bg-sidebar",
  danger: "border-danger-border bg-surface text-danger hover:bg-danger-soft",
  text: "border-transparent bg-transparent text-primary hover:underline",
};
function classes(variant: Variant, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-control border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button type={type} className={classes(variant, className)} {...props} />
  );
}
export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={classes(variant, className)} {...props} />;
}
