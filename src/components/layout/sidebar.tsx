import { DashboardLink } from "./dashboard-link";
import { getNavigation } from "@/config/navigation";
import type { ModuleId } from "@/config/pages";
import type { Role } from "@/config/roles";
import { cn } from "@/lib/cn";
import { ModuleIcon } from "./module-icon";
export function Sidebar({
  role,
  activeModule,
}: {
  role: Role;
  activeModule: ModuleId;
}) {
  return (
    <aside className="border-border bg-sidebar border-b px-3.5 py-5 lg:min-h-screen lg:w-(--sidebar-width) lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="mb-4.5 flex items-center gap-2.5 px-1.5">
        <span className="brand-gradient text-surface grid size-9.5 place-items-center rounded-[11px] text-[17px] font-extrabold">
          Z
        </span>
        <div>
          <p className="text-[15px] font-extrabold">Zaraff</p>
          <p className="text-muted text-xs">Collection</p>
        </div>
      </div>
      <nav aria-label="Menu utama" className="flex flex-wrap gap-1 lg:flex-col">
        {getNavigation(role).map((item) => (
          <DashboardLink
            key={item.id}
            href={item.href}
            aria-current={activeModule === item.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-[14.5px]",
              activeModule === item.id
                ? "bg-table-header text-surface font-bold"
                : "text-foreground hover:bg-highlight",
            )}
          >
            <ModuleIcon module={item.id} />
            {item.label}
          </DashboardLink>
        ))}
      </nav>
    </aside>
  );
}
