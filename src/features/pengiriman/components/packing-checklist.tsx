"use client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/form-field";
import { LocationBadge } from "@/components/ui/badge";
import type { WarehouseItem } from "@/features/gudang/model";
import type { PackingChecklist } from "../model";
export function PackingChecklistCards({
  items,
  checklist,
  disabled,
  onChange,
}: {
  items: readonly WarehouseItem[];
  checklist: PackingChecklist;
  disabled: boolean;
  onChange: (value: PackingChecklist) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-5 text-base font-bold">1. Ambil dari rak</h2>
        <ul className="divide-border-subtle divide-y">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <Checkbox
                  label={item.id}
                  aria-label={`Ambil ${item.id}`}
                  disabled={disabled}
                  checked={checklist.pickedItemIds.includes(item.id)}
                  onChange={(event) =>
                    onChange({
                      ...checklist,
                      pickedItemIds: event.target.checked
                        ? [...checklist.pickedItemIds, item.id]
                        : checklist.pickedItemIds.filter(
                            (id) => id !== item.id,
                          ),
                    })
                  }
                />
                <p className="text-muted mt-1 ml-6.5 text-[13px]">
                  {item.category} · grade {item.grade ?? "—"} · {item.condition}
                </p>
              </div>
              {item.locationId ? (
                <LocationBadge>{item.locationId}</LocationBadge>
              ) : (
                <span className="text-muted text-sm">Lokasi sudah dilepas</span>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-5 text-base font-bold">2. Quality check</h2>
        <div className="space-y-3">
          <Checkbox
            label="Kode fisik cocok dengan pesanan"
            checked={checklist.codeMatches}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...checklist, codeMatches: event.target.checked })
            }
          />
          <Checkbox
            label="Kondisi sesuai grade, tidak ada kerusakan baru"
            checked={checklist.conditionMatches}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...checklist, conditionMatches: event.target.checked })
            }
          />
        </div>
      </Card>
      <Card>
        <h2 className="mb-5 text-base font-bold">3. Kemas</h2>
        <Checkbox
          label="Barang sudah dikemas sesuai standar"
          checked={checklist.packed}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...checklist, packed: event.target.checked })
          }
        />
      </Card>
    </div>
  );
}
