"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

/** Native dialog supplies focus trapping, Escape and inert background content. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        // Native close events are queued. Ignore an earlier close if the
        // controlled dialog has already reopened (e.g. Escape, then Ctrl K).
        if (!event.currentTarget.open) onClose();
      }}
      className="dashboard-dialog"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <Button variant="text" aria-label="Tutup dialog" onClick={onClose}>
          Tutup
        </Button>
      </div>
      {children}
    </dialog>
  );
}
