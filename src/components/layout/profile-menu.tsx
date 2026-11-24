"use client";
import { useEffect, useRef } from "react";
import { roleLabels } from "@/config/roles";
import type { User } from "@/types/domain";
import { Button } from "@/components/ui/button";
export function ProfileMenu({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        ref.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  return (
    <details ref={ref} className="relative">
      <summary
        aria-label="Menu profil"
        className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg [&::-webkit-details-marker]:hidden"
      >
        <span className="bg-highlight text-primary grid size-9 place-items-center rounded-full font-bold">
          {user.name.slice(0, 1)}
        </span>
        <span className="text-left">
          <span className="block text-[13.5px] font-bold">{user.name}</span>
          <span className="text-muted block text-xs">
            {roleLabels[user.role]}
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-muted"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="rounded-card border-border bg-surface absolute right-0 z-20 mt-2 min-w-60 border p-4">
        <p className="font-semibold">{user.name}</p>
        <p className="text-muted mb-3 text-xs">
          {roleLabels[user.role]} · {user.email}
        </p>
        <Button
          variant="text"
          onClick={() => {
            if (ref.current) ref.current.open = false;
            onLogout();
          }}
        >
          Keluar
        </Button>
      </div>
    </details>
  );
}
