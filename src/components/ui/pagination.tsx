import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

interface PaginationProps {
  pagination: PaginationData;
  /** Plural noun for the "Showing 1–10 of 42 …" summary. */
  noun: string;
  hrefForPage: (page: number) => string;
}

/** Page numbers to show, with `null` marking a gap. */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  return sorted.flatMap((page, index) =>
    index > 0 && page - sorted[index - 1] > 1 ? [null, page] : [page],
  );
}

const itemStyles =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-semibold tabular-nums transition-colors";

export function Pagination({ pagination, noun, hrefForPage }: PaginationProps) {
  const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-muted">
        Showing <span className="font-semibold text-ink-soft">{formatNumber(from)}</span>–
        <span className="font-semibold text-ink-soft">{formatNumber(to)}</span> of{" "}
        <span className="font-semibold text-ink-soft">{formatNumber(total)}</span> {noun}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
          <PageLink href={hasPrevPage ? hrefForPage(page - 1) : null} label="Previous page">
            <ChevronLeft className="size-4" />
          </PageLink>

          {pageWindow(page, totalPages).map((item, index) =>
            item === null ? (
              <span key={`gap-${index}`} className="px-1 text-xs text-subtle">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={hrefForPage(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  itemStyles,
                  item === page
                    ? "border-brand bg-brand text-brand-ink"
                    : "border-line-strong bg-surface-raised text-ink-soft hover:border-brand hover:text-brand",
                )}
              >
                {item}
              </Link>
            ),
          )}

          <PageLink href={hasNextPage ? hrefForPage(page + 1) : null} label="Next page">
            <ChevronRight className="size-4" />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className={cn(itemStyles, "border-line bg-surface text-subtle opacity-50")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        itemStyles,
        "border-line-strong bg-surface-raised text-ink-soft hover:border-brand hover:text-brand",
      )}
    >
      {children}
    </Link>
  );
}
