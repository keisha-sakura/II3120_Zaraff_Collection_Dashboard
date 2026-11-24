import type { ReactNode } from "react";
export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
  cancelAction,
}: {
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  cancelAction?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {cancelAction}
        {secondaryAction}
        {primaryAction}
      </div>
    </div>
  );
}
