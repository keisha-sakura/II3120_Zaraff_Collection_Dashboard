"use client";
import { useEffect, useState } from "react";
import { getSearchPages } from "@/config/navigation";
import type { PageDefinition } from "@/config/pages";
import type { Role } from "@/config/roles";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Caller resolves detail templates with real IDs; never navigate to [itemId]. */
export function QuickSearch({
  role,
  open,
  onOpenChange,
  onSelect,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (page: PageDefinition) => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !event.repeat &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);
  const results = getSearchPages(role, query);
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Pencarian cepat"
    >
      <Input
        autoFocus
        aria-label="Cari halaman"
        placeholder="Cari halaman…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p className="text-muted mt-4 text-xs font-semibold">Halaman</p>
      <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto">
        {results.map((page) => (
          <li key={page.id}>
            <Button
              variant="text"
              className="w-full justify-start"
              onClick={() => {
                onSelect(page);
                onOpenChange(false);
              }}
            >
              {page.title}
            </Button>
          </li>
        ))}
      </ul>
      {!results.length && <EmptyState title="Halaman tidak ditemukan" />}
    </Dialog>
  );
}
