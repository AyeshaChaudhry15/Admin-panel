"use client";

import { AnimatePresence, m } from "framer-motion";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { createContext, use, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;

const toneStyles: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: "bg-brand text-brand-ink" },
  error: { icon: CircleAlert, className: "bg-danger text-white" },
  info: { icon: Info, className: "bg-info text-white" },
};

export function useToast() {
  const toast = use(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>.");
  return toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  function dismiss(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function push(tone: ToastTone, message: string) {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, { id, tone, message }].slice(-MAX_VISIBLE));
    window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
  }

  const api: ToastApi = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    info: (message) => push("info", message),
  };

  return (
    <ToastContext value={api}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-100 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, className } = toneStyles[toast.tone];

            return (
              <m.div
                key={toast.id}
                layout
                role={toast.tone === "error" ? "alert" : "status"}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-surface-raised px-4 py-3 text-sm text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                    className,
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2.5} />
                </span>

                <p className="flex-1 leading-relaxed">{toast.message}</p>

                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="-mr-1 rounded-md p-0.5 text-muted transition-colors hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
