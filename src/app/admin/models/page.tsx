import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bike as BikeIcon,
  SearchX,
  Star,
  Tag,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { Suspense } from "react";
import { BikesManager } from "@/app/admin/models/bikes-manager";
import {
  ModelSearch,
  NumberFilters,
} from "@/app/admin/models/model-filters";
import { CreateButton, RowActions } from "@/components/crud";
import { SectionBoundary } from "@/components/section-boundary";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs, SelectFilter } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { Thumbnail } from "@/components/ui/thumbnail";
import {
  BIKE_NUMBER_FILTERS,
  BIKE_SPEC_FIELDS,
  BIKE_TYPES,
} from "@/lib/constants";
import {
  capitalize,
  formatNumber,
  formatPKR,
  pluralize,
} from "@/lib/format";
import { getBikes, getBrands } from "@/lib/server/queries";
import {
  firstParam,
  hrefWith,
  parseOneOf,
  parsePage,
  type SearchParams,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { BikeListQuery } from "@/types/api";

export const metadata: Metadata = { title: "Models" };

const PATH = "/admin/models";

function parseAmount(value: string | string[] | undefined) {
  const param = firstParam(value)?.trim();

  if (!param) return undefined;

  const amount = Number(param);

  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

function formatAmount(value: number, unit: string) {
  return unit === "PKR"
    ? formatPKR(value)
    : `${formatNumber(value)} ${unit}`;
}

export default async function ModelsPage({
  searchParams,
}: PageProps<"/admin/models">) {
  const params = await searchParams;
  const brands = await getBrands();

  const page = parsePage(params.page);
  const type = parseOneOf(params.type, BIKE_TYPES);
  const brandParam = firstParam(params.brand);

  const brand = brands.some((item) => item._id === brandParam)
    ? brandParam
    : undefined;

  const search = firstParam(params.search)?.trim() || undefined;

  const numbers: BikeListQuery = {};

  for (const { min, max } of BIKE_NUMBER_FILTERS) {
    const low = parseAmount(params[min]);
    const high = parseAmount(params[max]);

    const swap =
      low !== undefined && high !== undefined && low > high;

    numbers[min] = swap ? high : low;
    numbers[max] = swap ? low : high;
  }

  const current: SearchParams = {
    type,
    brand,
    search,
    ...Object.fromEntries(
      Object.entries(numbers).map(([key, value]) => [
        key,
        value?.toString(),
      ]),
    ),
    page: page > 1 ? String(page) : undefined,
  };

  const filterHref = (
    patch: Record<string, string | null>,
  ) => hrefWith(PATH, current, { ...patch, page: null });

  const chips = BIKE_NUMBER_FILTERS.flatMap(
    ({ label, unit, min, max }) => {
      const low = numbers[min];
      const high = numbers[max];

      if (low === undefined && high === undefined) return [];

      const range =
        low !== undefined && high !== undefined
          ? `${formatAmount(low, unit)} – ${formatAmount(high, unit)}`
          : low !== undefined
            ? `from ${formatAmount(low, unit)}`
            : `up to ${formatAmount(high!, unit)}`;

      return [
        {
          key: min,
          text: `${label}: ${range}`,
          href: filterHref({
            [min]: null,
            [max]: null,
          }),
        },
      ];
    },
  );

  return (
    <BikesManager
      brands={brands.map(({ _id, displayName }) => ({
        _id,
        displayName,
      }))}
      initialCreate={firstParam(params.new) === "1"}
    >
      <div className="space-y-6">
        <PageHeader
          icon={BikeIcon}
          eyebrow="Catalog"
          title="Models"
          description="Manage the electric bikes and scooters listed on the website."
          actions={<CreateButton label="Add Model" />}
        />

        <SectionBoundary title="model stats">
          <Suspense fallback={<StatsSkeleton />}>
            <ModelStats brandCount={brands.length} />
          </Suspense>
        </SectionBoundary>

        <Panel>
          <PanelHeader
            title="All Models"
            description="Newest first"
            toolbar={
              <>
                <FilterTabs
                  label="Filter by type"
                  layoutId="models-type"
                  activeHref={filterHref({})}
                  tabs={[
                    {
                      label: "All",
                      href: filterHref({ type: null }),
                    },
                    {
                      label: "Bikes",
                      href: filterHref({ type: "bike" }),
                    },
                    {
                      label: "Scooters",
                      href: filterHref({ type: "scooter" }),
                    },
                  ]}
                />

                <SelectFilter
                  label="Filter by brand"
                  value={brand ?? ""}
                  options={[
                    {
                      value: "",
                      label: "All brands",
                    },
                    ...brands.map((item) => ({
                      value: item._id,
                      label: item.displayName,
                    })),
                  ]}
                  hrefs={Object.fromEntries([
                    ["", filterHref({ brand: null })],
                    ...brands.map((item) => [
                      item._id,
                      filterHref({
                        brand: item._id,
                      }),
                    ]),
                  ])}
                />
              </>
            }
          />

          <div className="flex flex-col gap-3 border-b border-[#1d2b38] px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
            <ModelSearch
              basePath={PATH}
              current={current}
            />

            <NumberFilters
              basePath={PATH}
              current={current}
            />

            {chips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                scroll={false}
                aria-label={`Remove filter ${chip.text}`}
                className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#FF8A00]/30 bg-[#FF8A00]/10 px-2.5 py-1 text-xs font-semibold text-[#FF8A00] transition-colors outline-none hover:bg-[#FF8A00]/20 focus-visible:ring-2 focus-visible:ring-[#FF8A00]/60 sm:self-auto"
              >
                {chip.text}
                <X className="size-3.5" />
              </Link>
            ))}
          </div>

          <Suspense
            key={hrefWith(PATH, current, {})}
            fallback={<TableSkeleton columns={6} />}
          >
            <ModelsTable
              query={{
                page,
                type,
                brand,
                search,
                ...numbers,
              }}
              hrefForPage={(target) =>
                hrefWith(PATH, current, {
                  page: target > 1 ? target : null,
                })
              }
              filtered={Boolean(
                type ||
                  brand ||
                  search ||
                  chips.length > 0,
              )}
            />
          </Suspense>
        </Panel>
      </div>
    </BikesManager>
  );
}

async function ModelStats({
  brandCount,
}: {
  brandCount: number;
}) {
  const [all, bikes] = await Promise.all([
    getBikes({ limit: 1 }),
    getBikes({
      type: "bike",
      limit: 1,
    }),
  ]);

  const total = all.pagination.total;
  const bikeCount = bikes.pagination.total;

  return (
    <StatGrid>
      <StatCard
        icon={BikeIcon}
        label="Total models"
        value={total}
      />

      <StatCard
        icon={BikeIcon}
        label="Electric bikes"
        value={bikeCount}
        href={`${PATH}?type=bike`}
      />

      <StatCard
        icon={Zap}
        tone="info"
        label="Electric scooters"
        value={total - bikeCount}
        href={`${PATH}?type=scooter`}
      />

      <StatCard
        icon={Tag}
        tone="warning"
        label="Brands"
        value={brandCount}
        href="/admin/brands"
      />
    </StatGrid>
  );
}

async function ModelsTable({
  query,
  hrefForPage,
  filtered,
}: {
  query: BikeListQuery & {
    page: number;
  };
  hrefForPage: (page: number) => string;
  filtered: boolean;
}) {
  const { bikes, pagination } = await getBikes(query);

  if (
    bikes.length === 0 &&
    pagination.totalPages > 0 &&
    query.page > pagination.totalPages
  ) {
    redirect(
      hrefForPage(pagination.totalPages),
    );
  }

  if (bikes.length === 0) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="No models match"
        description="Try a different search or filter."
      />
    ) : (
      <EmptyState
        icon={BikeIcon}
        title="No models yet"
        description="Add your first bike or scooter to list it on the website."
        action={<CreateButton label="Add Model" />}
      />
    );
  }

  return (
    <>
      <Table className="min-w-225">
        <TableHead>
          <TH>Model</TH>
          <TH>Brand</TH>
          <TH>Type</TH>
          <TH>Price</TH>
          <TH>Range / Top speed</TH>
          <TH align="right">Actions</TH>
        </TableHead>

        <tbody>
          {bikes.map((bike) => {
            const missing = BIKE_SPEC_FIELDS.filter(
              ({ key }) =>
                !bike.specs[key]?.trim(),
            ).length;

            return (
              <TR key={bike._id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Thumbnail
                      src={bike.imageUrl}
                      alt={bike.name}
                      fallback={BikeIcon}
                    />

                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-white">
                        {bike.name}

                        {missing > 0 && (
                          <Badge tone="warning">
                            {pluralize(
                              missing,
                              "spec",
                            )}{" "}
                            missing
                          </Badge>
                        )}
                      </p>

                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3 fill-[#FF8A00] text-[#FF8A00]" />
                          {bike.rating.toFixed(1)}
                        </span>

                        <span className="truncate font-mono text-subtle">
                          /{bike.slug}
                        </span>
                      </p>
                    </div>
                  </div>
                </TD>

                <TD>
                  <div className="flex items-center gap-2">
                    <Thumbnail
                      src={bike.brand.logoUrl}
                      alt=""
                      fallback={Tag}
                      size="sm"
                    />

                    {bike.brand.displayName}
                  </div>
                </TD>

                <TD>
                  <Badge
                    tone={
                      bike.type === "bike"
                        ? "brand"
                        : "info"
                    }
                  >
                    {bike.type === "bike" ? (
                      <BikeIcon />
                    ) : (
                      <Zap />
                    )}

                    {capitalize(bike.type)}
                  </Badge>
                </TD>

                <TD className="font-semibold whitespace-nowrap text-white tabular-nums">
                  {formatPKR(bike.price)}
                </TD>

                <TD className="text-xs">
                  <SpecLine
                    text={bike.specs.range}
                    value={bike.rangeKm}
                    filter="range"
                  />

                  <SpecLine
                    text={bike.specs.topSpeed}
                    value={bike.topSpeedKmh}
                    filter="top speed"
                    className="mt-0.5 text-muted"
                  />
                </TD>

                <TD align="right">
                  <RowActions
                    item={bike}
                    name={bike.name}
                  />
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>

      <Pagination
        pagination={pagination}
        noun="models"
        hrefForPage={hrefForPage}
      />
    </>
  );
}

function SpecLine({
  text,
  value,
  filter,
  className,
}: {
  text: string;
  value: number | null;
  filter: string;
  className?: string;
}) {
  if (!text?.trim()) {
    return <p className={className}>—</p>;
  }

  const warning = `No number found, so this model won't match ${filter} filters.`;

  return (
    <p
      className={cn(
        "flex items-center gap-1",
        className,
      )}
    >
      {text}

      {value === null && (
        <span
          title={warning}
          className="text-[#FF8A00]"
        >
          <TriangleAlert
            aria-hidden
            className="size-3.5"
          />
          <span className="sr-only">
            {warning}
          </span>
        </span>
      )}
    </p>
  );
}