"use client";

import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { toneTile } from "@/components/ui/tone";
import { useIsClient } from "@/hooks/use-is-client";
import type { Tone } from "@/lib/constants";
import { lockScroll } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizes = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  size?: keyof typeof sizes;
  /** While true the dialog can't be dismissed (e.g. a save is in flight). */
  busy?: boolean;
  children: React.ReactNode;
}

/**
 * Accessible modal: focus is moved in and trapped, Escape and the backdrop
 * close it, page scroll is locked, and focus returns to the trigger on close.
 * On phones it slides up as a bottom sheet.
 */
export function Dialog(props: DialogProps) {
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>{props.open && <DialogPanel {...props} />}</AnimatePresence>,
    document.body,
  );
}

function DialogPanel({
  onClose,
  title,
  description,
  icon,
  tone = "brand",
  size = "md",
  busy = false,
  children,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus();

    const unlockScroll = lockScroll();

    return () => {
      unlockScroll();
      // Don't steal focus from another dialog that opened as this one closed.
      const active = document.activeElement;
      if (!active || active === document.body || panel?.contains(active)) {
        previouslyFocused?.focus();
      }
    };
  }, []);

  function requestClose() {
    if (!busy) onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      requestClose();
      return;
    }

    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || active === panelRef.current)) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onKeyDown={handleKeyDown}
    >
      <m.div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={requestClose}
      />

      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line-strong bg-surface shadow-[0_30px_100px_rgba(0,0,0,0.6)] outline-none sm:rounded-2xl",
          sizes[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
                  toneTile[tone],
                )}
              >
                {icon}
              </span>
            )}

            <div className="min-w-0 pt-0.5">
              <h2 id={titleId} className="text-lg font-bold text-white">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-0.5 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close dialog"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="size-5" />
          </button>
        </header>

        {children}
      </m.div>
    </div>
  );
}

export function DialogBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6", className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}
