"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <m.span
      aria-hidden
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
    />
  );
}
