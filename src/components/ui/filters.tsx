"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
} from "lucide-react";
import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  fieldStyles,
  Select,
} from "@/components/ui/form";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface FilterTab {
  label: string;
  href: string;
  count?: number | null;
}

function isPlainClick(event: React.MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

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
  const [optimisticHref, setOptimisticHref] =
    useOptimistic(activeHref);

  return (
    <nav
      aria-label={label}
      className="flex max-w-full overflow-x-auto rounded-xl border border-[#D9E2F2] bg-white p-1 scrollbar-none shadow-sm"
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
                router.push(tab.href, {
                  scroll: false,
                });
              });
            }}
            className={cn(
              "relative flex-1 rounded-lg px-3.5 py-2 text-center text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0057D9]/40 sm:flex-none",
              active
                ? "text-white"
                : "text-[#64748B] hover:text-[#0057D9]",
            )}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-[#0057D9]"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 40,
                }}
              />
            )}

            <span className="relative">
              {tab.label}

              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active
                      ? "opacity-80"
                      : "text-[#94A3B8]",
                  )}
                >
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

export function SelectFilter({
  label,
  value,
  options,
  hrefs,
}: {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
  }[];
  hrefs: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] =
    useTransition();

  const [optimisticValue, setOptimisticValue] =
    useOptimistic(value);

  return (
    <div className="relative sm:w-52">
      <Select
        aria-label={label}
        value={optimisticValue}
        onChange={(event) => {
          const next = event.target.value;

          startTransition(() => {
            setOptimisticValue(next);
            router.push(hrefs[next], {
              scroll: false,
            });
          });
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </Select>

      {pending && (
        <Spinner className="absolute top-1/2 right-10 size-3.5 -translate-y-1/2 text-[#0057D9]" />
      )}
    </div>
  );
}

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
  const [value, setValue] =
    useState(defaultValue);

  const [pending, startTransition] =
    useTransition();

  const timer = useRef<
    number | undefined
  >(undefined);

  function update(next: string) {
    setValue(next);

    window.clearTimeout(timer.current);

    timer.current = window.setTimeout(() => {
      const query = next.trim();

      startTransition(() => {
        router.replace(
          query
            ? `${basePath}?q=${encodeURIComponent(query)}`
            : basePath,
          {
            scroll: false,
          },
        );
      });
    }, 250);
  }

  return (
    <div className="relative w-full sm:w-72">
      {pending ? (
        <Spinner className="absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-[#0057D9]" />
      ) : (
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#98A2B3]" />
      )}

      <input
        type="search"
        value={value}
        onChange={(event) =>
          update(event.target.value)
        }
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          fieldStyles,
          "h-11 pr-10 pl-11 [&::-webkit-search-cancel-button]:hidden",
        )}
      />

      {value && (
        <button
          type="button"
          onClick={() => update("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-md p-0.5 text-[#98A2B3] transition-colors hover:text-[#0057D9]"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}