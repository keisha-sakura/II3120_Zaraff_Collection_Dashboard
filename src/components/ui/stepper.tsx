import { cn } from "@/lib/cn";
export type Step = { id: string; label: string };
export function Stepper({
  steps,
  activeId,
  label = "Tahapan proses",
}: {
  steps: readonly Step[];
  activeId: string;
  label?: string;
}) {
  const activeIndex = steps.findIndex((step) => step.id === activeId);
  return (
    <ol aria-label={label} className="mb-6 flex flex-wrap gap-3">
      {steps.map((step, index) => (
        <li
          key={step.id}
          aria-current={step.id === activeId ? "step" : undefined}
          className={cn(
            "rounded-control flex items-center gap-2 px-3 py-2 text-sm",
            index === activeIndex
              ? "bg-highlight text-primary font-bold"
              : "text-muted",
          )}
        >
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full border text-xs",
              index <= activeIndex
                ? "border-primary bg-primary text-surface"
                : "border-border-control",
            )}
          >
            {index + 1}
          </span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}
