import { Card } from "@/components/ui/card";
import type { OwnerNote } from "../contracts";
export function OwnerNotes({ note }: { note: OwnerNote }) {
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(note.publishedAt));
  return (
    <Card aria-labelledby="owner-note-heading" className="px-5 py-4.5">
      <h2
        id="owner-note-heading"
        className="text-primary mb-3.5 text-base font-bold"
      >
        Notes Owner
      </h2>
      <p className="mb-1.5 text-[13px]">
        <time dateTime={note.publishedAt}>{dateLabel}</time>
        <span className="ml-2 font-bold">{note.title}</span>
      </p>
      <ol className="text-muted list-inside list-decimal">
        {note.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </Card>
  );
}
