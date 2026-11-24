"use client";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { useWorkspace } from "@/lib/workspace-store";
import type { Role } from "@/config/roles";
import { DashboardLink, useDashboardNavigation } from "./dashboard-link";
import { findSearchResults } from "./search-results";
export function GlobalSearch({ role }: { role: Role }) {
  const [query, setQuery] = useState("");
  const resultsId = useId();
  const navigation = useDashboardNavigation();
  const router = useRouter();
  const snapshot = useWorkspace();
  const results = findSearchResults(role, query, snapshot?.data);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) {
      if (navigation) navigation.navigate(results[0].href);
      else router.push(results[0].href);
      setQuery("");
    }
  }
  return (
    <form
      role="search"
      aria-label="Pencarian utama"
      onSubmit={submit}
      className="min-w-0 flex-1 sm:max-w-105"
    >
      <SearchInput
        aria-label="Cari menu, kode barang, atau pesanan"
        placeholder="Cari menu, kode barang, atau pesanan"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-controls={query.trim() ? resultsId : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") setQuery("");
        }}
      />
      {query.trim() && (
        <div id={resultsId} className="border-border mt-2 border-t pt-2">
          <p role="status" className="text-muted px-2 py-1 text-xs">
            {results.length
              ? `${results.length} hasil pencarian`
              : "Tidak ada hasil yang sesuai."}
          </p>
          <ul className="space-y-1">
            {results.map((result) => (
              <li key={result.id}>
                <DashboardLink
                  href={result.href}
                  onClick={() => setQuery("")}
                  className="hover:bg-sidebar focus-visible:bg-sidebar rounded-control block px-3 py-2"
                >
                  <span className="block text-sm font-semibold break-words">
                    {result.label}
                  </span>
                  <span className="text-muted block text-xs break-words">
                    {result.description}
                  </span>
                </DashboardLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
