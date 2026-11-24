"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FilterSelect, Input } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { categories } from "@/features/gudang/model";
import type { ItemCategory } from "@/types/domain";
import {
  grades,
  gradeConditions,
  maxRecommendedPrice,
  type PriceRules,
} from "../../model";
import { useSettings } from "../../components/settings-provider";
export function PricingPage() {
  const { state } = useSettings();
  const [category, setCategory] = useState<ItemCategory>("Kemeja");
  return (
    <PricingForm
      key={JSON.stringify(state.priceRules)}
      saved={state.priceRules}
      category={category}
      setCategory={setCategory}
    />
  );
}
function PricingForm({
  saved,
  category,
  setCategory,
}: {
  saved: PriceRules;
  category: ItemCategory;
  setCategory: (category: ItemCategory) => void;
}) {
  const { run } = useSettings();
  const [draft, setDraft] = useState(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category,
          Object.fromEntries(
            grades.map((grade) => [grade, String(saved[category][grade])]),
          ),
        ]),
      ) as Record<ItemCategory, Record<(typeof grades)[number], string>>,
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceRules = Object.fromEntries(
      categories.map((category) => [
        category,
        Object.fromEntries(
          grades.map((grade) => [grade, Number(draft[category][grade])]),
        ),
      ]),
    ) as PriceRules;
    run({ type: "save-prices", priceRules });
  }
  return (
    <form onSubmit={submit}>
      <PageHeader
        title="Aturan Harga"
        primaryAction={<Button type="submit">Simpan perubahan</Button>}
      />
      <div className="mb-4">
        <FilterSelect
          label="Kategori"
          aria-label="Kategori"
          value={category}
          onChange={(event) => setCategory(event.target.value as ItemCategory)}
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </FilterSelect>
      </div>
      <DataTable
        caption="Aturan harga per kategori dan grade"
        rows={grades.map((grade) => ({ grade }))}
        rowKey={(row) => row.grade}
        columns={[
          { id: "category", header: "Kategori", cell: () => category },
          {
            id: "condition",
            header: "Kondisi",
            cell: (row) => gradeConditions[row.grade],
          },
          { id: "grade", header: "Grade", cell: (row) => row.grade },
          {
            id: "price",
            header: "Harga rekomendasi",
            cell: (row) => (
              <Input
                className="w-40 text-right"
                type="number"
                min={1}
                max={maxRecommendedPrice}
                step={1}
                required
                aria-label={`Harga ${category} grade ${row.grade}`}
                value={draft[category][row.grade]}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    [category]: {
                      ...draft[category],
                      [row.grade]: event.target.value,
                    },
                  })
                }
              />
            ),
          },
        ]}
      />
      <p className="text-muted mt-4 text-xs">
        Harga dalam rupiah. Simpan berlaku untuk perubahan di seluruh kategori.
        Aturan dipakai pada grading berikutnya; harga barang yang sudah
        tersimpan tetap.
      </p>
    </form>
  );
}
