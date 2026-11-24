import type { ReactNode } from "react";
export function DetailList({
  entries,
}: {
  entries: readonly { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="grid grid-cols-[minmax(100px,1fr)_2fr] gap-4 text-sm"
        >
          <dt className="text-muted">{entry.label}</dt>
          <dd className="min-w-0 font-medium break-words">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
