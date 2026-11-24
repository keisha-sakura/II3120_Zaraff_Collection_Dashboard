import type { ReactNode } from "react";
export type TimelineEntry = {
  id: string;
  title: string;
  description?: ReactNode;
  dateTime: string;
  formattedTime: string;
};
export function Timeline({
  entries,
  label = "Riwayat aktivitas",
}: {
  entries: readonly TimelineEntry[];
  label?: string;
}) {
  return (
    <ol aria-label={label} className="border-border space-y-5 border-l pl-5">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="before:bg-primary relative before:absolute before:top-1.5 before:-left-6 before:size-2 before:rounded-full"
        >
          <p className="font-semibold">{entry.title}</p>
          <time dateTime={entry.dateTime} className="text-muted text-xs">
            {entry.formattedTime}
          </time>
          {entry.description && (
            <div className="text-muted mt-1 text-sm">{entry.description}</div>
          )}
        </li>
      ))}
    </ol>
  );
}
