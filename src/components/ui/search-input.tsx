import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
export function SearchInput({
  className,
  wrapperClassName,
  ...props
}: ComponentProps<"input"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative min-w-0", wrapperClassName)}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
        className="text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4-4" />
      </svg>
      <input
        type="search"
        className={cn("control pl-10", className)}
        {...props}
      />
    </div>
  );
}
