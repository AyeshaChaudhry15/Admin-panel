"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { fieldStyles, Select } from "@/components/ui/form";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface FilterTab {
  label: string;
  href: string;
  count?: number | null;
}

function isPlainClick(event: React.MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * Segmented links that filter a list through the URL. The active pill moves
 * immediately (optimistically) while the server renders the new results.
 */
export function FilterTabs({
  label,
  tabs,
  activeHref,
  layoutId,
}: {
  label: string;
  tabs: FilterTab[];
  activeHref: string;
  layoutId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticHref, setOptimisticHref] = useOptimistic(activeHref);

  return (
    <nav
      aria-label={label}
      className="flex max-w-full overflow-x-auto rounded-xl border border-line-strong bg-field p-1 [scrollbar-width:none]"
    >
      {tabs.map((tab) => {
        const active = tab.href === optimisticHref;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (!isPlainClick(event)) return;
              event.preventDefault();
              startTransition(() => {
                setOptimisticHref(tab.href);
                router.push(tab.href, { scroll: false });
              });
            }}
            className={cn(
              "relative flex-1 rounded-lg px-3.5 py-2 text-center text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/60 sm:flex-none",
              active ? "text-brand-ink" : "text-muted hover:text-white",
            )}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">
              {tab.label}
              {typeof tab.count === "number" && (
                <span className={cn("ml-1.5 tabular-nums", active ? "opacity-70" : "text-subtle")}>
                  {formatNumber(tab.count)}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** A `<select>` that navigates to the href mapped to each option. */
export function SelectFilter({
  label,
  value,
  options,
  hrefs,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  hrefs: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);

  return (
    <div className="relative sm:w-52">
      <Select
        aria-label={label}
        value={optimisticValue}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(() => {
            setOptimisticValue(next);
            router.push(hrefs[next], { scroll: false });
          });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {pending && <Spinner className="absolute top-1/2 right-10 size-3.5 -translate-y-1/2 text-brand" />}
    </div>
  );
}

/** Debounced search box that keeps its value in the `?q=` search param. */
export function SearchField({
  basePath,
  defaultValue,
  placeholder,
}: {
  basePath: string;
  defaultValue: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  function update(next: string) {
    setValue(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const query = next.trim();
      startTransition(() => {
        router.replace(query ? `${basePath}?q=${encodeURIComponent(query)}` : basePath, {
          scroll: false,
        });
      });
    }, 250);
  }

  return (
    <div className="relative w-full sm:w-72">
      {pending ? (
        <Spinner className="absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-brand" />
      ) : (
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle" />
      )}

      <input
        type="search"
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(fieldStyles, "h-11 pr-10 pl-11 [&::-webkit-search-cancel-button]:hidden")}
      />

      {value && (
        <button
          type="button"
          onClick={() => update("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-md p-0.5 text-subtle transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
