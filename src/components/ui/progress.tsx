export function Progress({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description?: string;
}) {
  const percentage = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
  return (
    <div className="space-y-2">
      <p className="font-semibold">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-highlight h-2.5 overflow-hidden rounded-full"
      >
        <div
          className="brand-gradient h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && <p className="text-muted text-sm">{description}</p>}
    </div>
  );
}
