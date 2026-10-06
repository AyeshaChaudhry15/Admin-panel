"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  /** Accessible name for the trigger button. */
  label: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  /** Receives `close` so items can dismiss the menu. */
  children: (close: () => void) => React.ReactNode;
}

/** Trigger + floating panel that closes on outside click, Escape or item selection. */
export function Dropdown({ label, trigger, triggerClassName, panelClassName, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
          triggerClassName,
        )}
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            id={panelId}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            style={{ transformOrigin: "top right" }}
            className={cn(
              "absolute top-full right-0 z-50 mt-2 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_15px_35px_rgba(0,0,0,0.5)]",
              panelClassName,
            )}
          >
            {children(() => setOpen(false))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
