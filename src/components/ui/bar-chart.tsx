import { Card } from "./card";
export function BarChart({
  title,
  values,
}: {
  title: string;
  values: readonly { label: string; value: number }[];
}) {
  const max = Math.max(1, ...values.map((row) => row.value));
  return (
    <Card>
      <h2 className="mb-5 text-base font-bold">{title}</h2>
      <div
        role="img"
        aria-label={`${title}: ${values.map((row) => `${row.label}: ${row.value}`).join(", ")}`}
      >
        <div className="border-border flex h-48 items-end gap-3 border-b pt-6">
          {values.map((row) => (
            <div
              key={row.label}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-sm font-bold">{row.value}</span>
              <div
                className="bg-table-header w-full max-w-14 rounded-t"
                style={{
                  height: `${(row.value / max) * 82}%`,
                  minHeight: row.value ? 3 : 0,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-3">
          {values.map((row) => (
            <span
              key={row.label}
              className="text-muted min-w-0 flex-1 text-center text-xs"
            >
              {row.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
