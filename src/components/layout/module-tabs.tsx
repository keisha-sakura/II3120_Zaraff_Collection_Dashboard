import Link from "next/link";
import { cn } from "@/lib/cn";
export function ModuleTabs({
  items,
  activeId,
}: {
  items: readonly { id: string; title: string; path: string }[];
  activeId: string;
}) {
  return (
    <nav
      aria-label="Halaman modul"
      className="border-border mb-6 flex gap-5 overflow-x-auto border-b"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.path}
          aria-current={activeId === item.id ? "page" : undefined}
          className={cn(
            "border-b-2 px-1 py-3 text-sm whitespace-nowrap",
            activeId === item.id
              ? "border-primary text-primary font-bold"
              : "text-muted hover:text-primary border-transparent",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
