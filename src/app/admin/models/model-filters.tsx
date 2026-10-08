"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { fieldStyles, FormAlert, Input } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { BIKE_NUMBER_FILTERS } from "@/lib/constants";
import { hrefWith, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface FilterProps {
  basePath: string;
  current: SearchParams;
}

export function ModelSearch({ basePath, current }: FilterProps) {
  const router = useRouter();
  const [value, setValue] = useState(
    typeof current.search === "string" ? current.search : "",
  );
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  function update(next: string) {
    setValue(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      startTransition(() => {
        router.replace(
          hrefWith(basePath, current, { search: next.trim(), page: null }),
          { scroll: false },
        );
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
        placeholder="Search models by name"
        aria-label="Search models by name"
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
          className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-md p-0.5 text-subtle transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

const NUMBER_KEYS = BIKE_NUMBER_FILTERS.flatMap(({ min, max }) => [min, max]);

export function NumberFilters({ basePath, current }: FilterProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = NUMBER_KEYS.filter((key) => current[key]).length;

  function apply(patch: Record<string, string | null>) {
    startTransition(() => {
      router.push(hrefWith(basePath, current, { ...patch, page: null }), {
        scroll: false,
      });
    });
  }

  return (
    <Dropdown
      label="Filter by price, top speed and range"
      triggerClassName={buttonStyles({
        variant: "secondary",
        className: "w-full sm:w-auto",
      })}
      panelClassName="w-[min(20rem,calc(100vw-2rem))]"
      trigger={
        <>
          {pending ? <Spinner className="text-brand" /> : <SlidersHorizontal />}
          Filters
          {active > 0 && (
            <span className="rounded-full bg-brand px-1.5 text-[11px] leading-4.5 text-brand-ink tabular-nums">
              {active}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <NumberFiltersForm
          current={current}
          canReset={active > 0}
          onApply={(patch) => {
            close();
            apply(patch);
          }}
        />
      )}
    </Dropdown>
  );
}

function NumberFiltersForm({
  current,
  canReset,
  onApply,
}: {
  current: SearchParams;
  canReset: boolean;
  onApply: (patch: Record<string, string | null>) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const patch: Record<string, string | null> = {};

        for (const { label, min, max } of BIKE_NUMBER_FILTERS) {
          const low = String(formData.get(min) ?? "").trim();
          const high = String(formData.get(max) ?? "").trim();
          if (low && high && Number(low) > Number(high)) {
            setError(`${label}: the minimum can't be more than the maximum.`);
            return;
          }
          patch[min] = low || null;
          patch[max] = high || null;
        }

        onApply(patch);
      }}
      className="space-y-4 p-4"
    >
      {BIKE_NUMBER_FILTERS.map(({ label, unit, min, max }) => (
        <fieldset key={min}>
          <legend className="mb-2 text-xs font-semibold text-ink-soft">
            {label} <span className="font-normal text-subtle">({unit})</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: min, text: "Min" },
              { name: max, text: "Max" },
            ].map(({ name, text }) => (
              <Input
                key={name}
                name={name}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={
                  typeof current[name] === "string" ? current[name] : ""
                }
                placeholder={text}
                aria-label={`${text} ${label.toLowerCase()} (${unit})`}
                className="h-10"
              />
            ))}
          </div>
        </fieldset>
      ))}

      {error && <FormAlert>{error}</FormAlert>}

      <div className="flex gap-2 border-t border-line pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          disabled={!canReset}
          onClick={() =>
            onApply(Object.fromEntries(NUMBER_KEYS.map((key) => [key, null])))
          }
        >
          Reset
        </Button>
        <Button type="submit" size="sm" className="flex-1">
          Apply
        </Button>
      </div>
    </form>
  );
}
