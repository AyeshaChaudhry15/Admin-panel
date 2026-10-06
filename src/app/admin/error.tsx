"use client";

import { RotateCw, ServerCrash } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <ServerCrash className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-bold text-white">Couldn&apos;t load this page</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The EVINN server didn&apos;t respond as expected. Check your connection and try again.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-subtle">Ref: {error.digest}</p>}
        <Button onClick={retry} className="mt-6">
          <RotateCw />
          Try again
        </Button>
      </div>
    </div>
  );
}
