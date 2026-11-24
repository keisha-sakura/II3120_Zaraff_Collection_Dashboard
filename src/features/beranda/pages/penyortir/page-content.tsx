import { ProgressSection } from "../../components/progress-section";
import { OwnerNotes } from "../../components/owner-notes";
import { progressPercentage, type SorterHomeData } from "../../contracts";
export function SorterHomePage({ data }: { data: SorterHomeData }) {
  return (
    <div className="space-y-4">
      <ProgressSection
        title="Progres kerja hari ini"
        headingId="sorter-progress-heading"
        items={[
          {
            id: "sorting",
            label: `Sortir bale ${data.baleId} · ${data.baleCategory}`,
            value: progressPercentage(data.sortedItems, data.totalItems),
            description: `${data.sortedItems} / ${data.totalItems} item tersortir`,
          },
          {
            id: "laundry",
            label: "Laundry",
            value: progressPercentage(data.launderedItems, data.totalItems),
            description: `${data.launderedItems} / ${data.totalItems} item dilaundry`,
          },
        ]}
      />
      <OwnerNotes note={data.note} />
    </div>
  );
}
