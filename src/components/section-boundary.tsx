"use client";

import { catchError, type ErrorInfo } from "next/error";
import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function SectionError({ title }: { title: string }, { retry }: ErrorInfo) {
  return (
    <div
      role="alert"
      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center"
    >
      <CloudOff className="size-6 text-subtle" />
      <p className="mt-3 text-sm font-semibold text-white">
        Couldn&apos;t load {title}
      </p>
      <p className="mt-1 text-xs text-muted">
        The rest of the page is still available.
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => retry()}
        className="mt-4"
      >
        <RotateCw />
        Try again
      </Button>
    </div>
  );
}

export const SectionBoundary = catchError(SectionError);
