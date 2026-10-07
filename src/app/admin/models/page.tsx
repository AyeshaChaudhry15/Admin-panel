import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bike as BikeIcon, SearchX, Star, Tag, Zap } from "lucide-react";
import { Suspense } from "react";
import { BikesManager } from "@/app/admin/models/bikes-manager";
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
import { BIKE_TYPES } from "@/lib/constants";
import { capitalize, formatPKR } from "@/lib/format";
import { getBikes, getBrands } from "@/lib/server/queries";
import { firstParam, hrefWith, parseOneOf, parsePage } from "@/lib/search-params";
import type { BikeListQuery } from "@/types/api";

export const metadata: Metadata = { title: "Models" };

const PATH = "/admin/models";

export default async function ModelsPage({ searchParams }: PageProps<"/admin/models">) {
  const params = await searchParams;
  const brands = await getBrands();

  const page = parsePage(params.page);
  const type = parseOneOf(params.type, BIKE_TYPES);
  const brandParam = firstParam(params.brand);
  const brand = brands.some((item) => item._id === brandParam) ? brandParam : undefined;

  const current = { type, brand, page: page > 1 ? String(page) : undefined };
  const filterHref = (patch: Record<string, string | null>) =>
    hrefWith(PATH, current, { ...patch, page: null });

  return (
    <BikesManager
      brands={brands.map(({ _id, displayName }) => ({ _id, displayName }))}
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
                    { label: "All", href: filterHref({ type: null }) },
                    { label: "Bikes", href: filterHref({ type: "bike" }) },
                    { label: "Scooters", href: filterHref({ type: "scooter" }) },
                  ]}
                />
                <SelectFilter
                  label="Filter by brand"
                  value={brand ?? ""}
                  options={[
                    { value: "", label: "All brands" },
                    ...brands.map((item) => ({ value: item._id, label: item.displayName })),
                  ]}
                  hrefs={Object.fromEntries([
                    ["", filterHref({ brand: null })],
                    ...brands.map((item) => [item._id, filterHref({ brand: item._id })]),
                  ])}
                />
              </>
            }
          />

          <Suspense key={`${type}-${brand}-${page}`} fallback={<TableSkeleton columns={6} />}>
            <ModelsTable
              query={{ page, type, brand }}
              hrefForPage={(target) => hrefWith(PATH, current, { page: target > 1 ? target : null })}
              filtered={Boolean(type || brand)}
            />
          </Suspense>
        </Panel>
      </div>
    </BikesManager>
  );
}

async function ModelStats({ brandCount }: { brandCount: number }) {
  const [all, bikes] = await Promise.all([
    getBikes({ limit: 1 }),
    getBikes({ type: "bike", limit: 1 }),
  ]);
  const total = all.pagination.total;
  const bikeCount = bikes.pagination.total;

  return (
    <StatGrid>
      <StatCard icon={BikeIcon} label="Total models" value={total} />
      <StatCard icon={BikeIcon} label="Electric bikes" value={bikeCount} href={`${PATH}?type=bike`} />
      <StatCard
        icon={Zap}
        tone="info"
        label="Electric scooters"
        value={total - bikeCount}
        href={`${PATH}?type=scooter`}
      />
      <StatCard icon={Tag} tone="warning" label="Brands" value={brandCount} href="/admin/brands" />
    </StatGrid>
  );
}

async function ModelsTable({
  query,
  hrefForPage,
  filtered,
}: {
  query: BikeListQuery & { page: number };
  hrefForPage: (page: number) => string;
  filtered: boolean;
}) {
  const { bikes, pagination } = await getBikes(query);

  if (bikes.length === 0 && pagination.totalPages > 0 && query.page > pagination.totalPages) {
    redirect(hrefForPage(pagination.totalPages));
  }

  if (bikes.length === 0) {
    return filtered ? (
      <EmptyState icon={SearchX} title="No models match" description="Try a different type or brand." />
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
          {bikes.map((bike) => (
            <TR key={bike._id}>
              <TD>
                <div className="flex items-center gap-3">
                  <Thumbnail src={bike.imageUrl} alt={bike.name} fallback={BikeIcon} />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{bike.name}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-brand text-brand" />
                        {bike.rating.toFixed(1)}
                      </span>
                      <span className="truncate font-mono text-subtle">/{bike.slug}</span>
                    </p>
                  </div>
                </div>
              </TD>
              <TD>
                <div className="flex items-center gap-2">
                  <Thumbnail src={bike.brand.logoUrl} alt="" fallback={Tag} size="sm" />
                  {bike.brand.displayName}
                </div>
              </TD>
              <TD>
                <Badge tone={bike.type === "bike" ? "brand" : "info"}>
                  {bike.type === "bike" ? <BikeIcon /> : <Zap />}
                  {capitalize(bike.type)}
                </Badge>
              </TD>
              <TD className="font-semibold whitespace-nowrap text-white tabular-nums">
                {formatPKR(bike.price)}
              </TD>
              <TD className="text-xs">
                <p>{bike.specs.range || "—"}</p>
                <p className="mt-0.5 text-muted">{bike.specs.topSpeed || "—"}</p>
              </TD>
              <TD align="right">
                <RowActions item={bike} name={bike.name} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      <Pagination pagination={pagination} noun="models" hrefForPage={hrefForPage} />
    </>
  );
}
