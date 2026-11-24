import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
export type HomeProgress = {
  id: string;
  label: string;
  value: number;
  description: string;
};
export function ProgressSection({
  title,
  items,
  headingId,
}: {
  title: string;
  items: readonly HomeProgress[];
  headingId: string;
}) {
  return (
    <Card aria-labelledby={headingId} className="px-5 py-4.5">
      <h2 id={headingId} className="text-primary mb-3.5 text-base font-bold">
        {title}
      </h2>
      <div className="space-y-5.5">
        {items.map(({ id, ...item }) => (
          <Progress key={id} {...item} />
        ))}
      </div>
    </Card>
  );
}
