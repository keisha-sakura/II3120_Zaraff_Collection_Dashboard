import type { ReactNode } from "react";
export function EmptyState({
  title = "Belum ada data",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-3 px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {description && <p className="text-muted text-sm">{description}</p>}
      {action}
    </div>
  );
}
