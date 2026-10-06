import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { toneTile } from "@/components/ui/tone";
import type { Tone } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  /** `null` when the number couldn't be loaded. */
  value: number | null;
  hint?: React.ReactNode;
  tone?: Tone;
  href?: string;
}

export function StatCard({ icon: Icon, label, value, hint, tone = "brand", href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn("flex size-11 items-center justify-center rounded-xl", toneTile[tone])}>
          <Icon className="size-5" />
        </span>
        {href && (
          <ArrowUpRight className="size-4 text-subtle transition-colors group-hover:text-brand" />
        )}
      </div>

      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-white tabular-nums">
        {value === null ? "—" : formatNumber(value)}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-subtle">{hint}</p>}
    </>
  );

  const className =
    "group block rounded-2xl border border-line bg-surface p-5 shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-colors";

  if (!href) return <div className={className}>{content}</div>;

  return (
    <Link
      href={href}
      className={cn(
        className,
        "outline-none hover:border-line-strong hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand/60",
      )}
    >
      {content}
    </Link>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
