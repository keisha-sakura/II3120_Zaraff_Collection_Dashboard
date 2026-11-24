import { ProgressSection } from "../../components/progress-section";
import { OwnerNotes } from "../../components/owner-notes";
import { progressPercentage, type PackingHomeData } from "../../contracts";
export function PackingHomePage({ data }: { data: PackingHomeData }) {
  return (
    <div className="space-y-4">
      <ProgressSection
        title="Progres kerja"
        headingId="packing-progress-heading"
        items={[
          {
            id: "packing",
            label: "Antrean packing",
            value: progressPercentage(data.packedOrders, data.paidOrders),
            description: `${data.packedOrders} / ${data.paidOrders} pesanan lunas sudah dikemas`,
          },
          {
            id: "picking",
            label: "Pengambilan barang dari rak",
            value: progressPercentage(data.pickedItems, data.totalItems),
            description: `${data.pickedItems} / ${data.totalItems} barang sudah diambil`,
          },
        ]}
      />
      <OwnerNotes note={data.note} />
    </div>
  );
}
