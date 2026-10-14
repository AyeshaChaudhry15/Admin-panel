import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | null;
  hint?: React.ReactNode;
  tone?: string;
  href?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#FFF1E6] text-[#FF8A00]">
          <Icon className="size-5" />
        </span>

        {href && (
          <ArrowUpRight className="size-4 text-[#0057D9] transition-colors group-hover:text-[#FF8A00]" />
        )}
      </div>

      <p className="mt-4 text-sm text-[#A9B8C9]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-white tabular-nums">
        {value === null ? "—" : formatNumber(value)}
      </p>

      {hint && (
        <p className="mt-1 truncate text-xs text-[#7F91A5]">
          {hint}
        </p>
      )}
    </>
  );

  const className =
    "group block rounded-2xl bg-[#0D1B26] p-5 shadow-[0_8px_30px_rgba(0,87,217,0.08)] transition-colors";

  if (!href) {
    return (
      <div className={className}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        className,
        "outline-none hover:bg-[#112332] focus-visible:ring-2 focus-visible:ring-[#0057D9]/40",
      )}
    >
      {content}
    </Link>
  );
}

export function StatGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}