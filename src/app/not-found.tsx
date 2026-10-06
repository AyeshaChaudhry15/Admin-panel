import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { DASHBOARD_PATH } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Compass className="size-6" />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-[0.2em] text-brand uppercase">404</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href={DASHBOARD_PATH} className={buttonStyles({ className: "mt-6" })}>
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
