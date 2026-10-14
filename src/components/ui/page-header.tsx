import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  eyebrow = "EVINN Admin Panel",
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-[#0057D9]/30 bg-[#0057D9]/10 text-[#0057D9]">
            <Icon className="size-4" />
          </span>

          <span className="text-[11px] font-bold tracking-[0.2em] text-[#FF8A00] uppercase">
            {eyebrow}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#E8EBF2] sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-sm text-[#8390A0]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}