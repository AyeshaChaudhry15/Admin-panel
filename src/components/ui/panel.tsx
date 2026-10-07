import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.22)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  title: string;
  description?: React.ReactNode;
  toolbar?: React.ReactNode;
  link?: { href: string; label: string };
}

export function PanelHeader({
  title,
  description,
  toolbar,
  link,
}: PanelHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        )}
      </div>

      {toolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {toolbar}
        </div>
      )}

      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1.5 self-start text-sm font-medium text-info transition-colors hover:text-white lg:self-auto"
        >
          {link.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
