import type { ReactNode } from "react";
import { DashboardLink } from "@/components/layout/dashboard-link";
export function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <DashboardLink
      href={href}
      className="rounded-card border-border bg-surface hover:border-border-secondary flex items-center gap-3.5 border px-4.5 py-4 transition-colors"
    >
      <span className="bg-highlight text-primary grid size-10 shrink-0 place-items-center rounded-xl">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="text-muted text-[13px]">{description}</span>
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-muted shrink-0"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </DashboardLink>
  );
}
