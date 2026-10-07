"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <m.div
      aria-hidden
      className={cn("rounded-lg bg-white/6", className)}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-line bg-surface p-5"
        >
          <Skeleton className="size-11 rounded-xl" />
          <Skeleton className="mt-4 h-3.5 w-24" />
          <Skeleton className="mt-2.5 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line/70">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-5 px-6 py-4">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          {Array.from({ length: columns - 1 }, (_, column) => (
            <Skeleton
              key={column}
              className={cn(
                "h-4 flex-1",
                column === 0 ? "max-w-48" : "max-w-28",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      <TableSkeleton rows={rows} columns={4} />
    </div>
  );
}

export function PageSkeleton({
  stats = 4,
  columns = 5,
}: {
  stats?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="mt-3 h-8 w-48" />
          <Skeleton className="mt-2.5 h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      {stats > 0 && <StatsSkeleton count={stats} />}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line px-6 py-4 sm:flex-row sm:justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-64 max-w-full rounded-xl" />
        </div>
        <TableSkeleton columns={columns} />
      </div>
    </div>
  );
}
