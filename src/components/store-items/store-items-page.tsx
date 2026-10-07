import { redirect } from "next/navigation";
import { CircleCheck, CircleX, Package, SearchX, Wrench } from "lucide-react";
import { Suspense } from "react";
import { CreateButton, RowActions } from "@/components/crud";
import { SectionBoundary } from "@/components/section-boundary";
import { StoreItemsManager } from "@/components/store-items/store-items-manager";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { Thumbnail } from "@/components/ui/thumbnail";
import { capitalize } from "@/lib/format";
import { getStoreItems } from "@/lib/server/queries";
import {
  firstParam,
  hrefWith,
  parseOneOf,
  parsePage,
  type SearchParams,
} from "@/lib/search-params";
import { STORE_KINDS, type StoreKind } from "@/lib/store-kinds";

const STOCK_FILTERS = ["in", "out"] as const;

/** Full list page shared by Accessories and Spare Parts. */
export function StoreItemsPage({
  kind,
  params,
}: {
  kind: StoreKind;
  params: SearchParams;
}) {
  const config = STORE_KINDS[kind];
  const Icon = kind === "accessories" ? Package : Wrench;

  const page = parsePage(params.page);
  const stock = parseOneOf(params.stock, STOCK_FILTERS);
  const current = { stock, page: page > 1 ? String(page) : undefined };
  const stockHref = (value: string | null) =>
    hrefWith(config.href, current, { stock: value, page: null });

  return (
    <StoreItemsManager
      kind={kind}
      initialCreate={firstParam(params.new) === "1"}
    >
      <div className="space-y-6">
        <PageHeader
          icon={Icon}
          eyebrow="Catalog"
          title={config.title}
          description={config.description}
          actions={
            <CreateButton label={`Add ${capitalize(config.singular)}`} />
          }
        />

        <SectionBoundary title={`${config.plural} stats`}>
          <Suspense fallback={<StatsSkeleton count={3} />}>
            <StockStats kind={kind} />
          </Suspense>
        </SectionBoundary>

        <Panel>
          <PanelHeader
            title={`All ${config.title}`}
            description="Newest first"
            toolbar={
              <FilterTabs
                label="Filter by stock"
                layoutId={`${kind}-stock`}
                activeHref={stockHref(stock ?? null)}
                tabs={[
                  { label: "All", href: stockHref(null) },
                  { label: "In stock", href: stockHref("in") },
                  { label: "Out of stock", href: stockHref("out") },
                ]}
              />
            }
          />

          <Suspense
            key={`${stock}-${page}`}
            fallback={<TableSkeleton columns={6} />}
          >
            <StoreItemsTable
              kind={kind}
              page={page}
              stock={stock}
              hrefForPage={(target) =>
                hrefWith(config.href, current, {
                  page: target > 1 ? target : null,
                })
              }
            />
          </Suspense>
        </Panel>
      </div>
    </StoreItemsManager>
  );
}

async function StockStats({ kind }: { kind: StoreKind }) {
  const [all, inStock] = await Promise.all([
    getStoreItems(kind, { limit: 1 }),
    getStoreItems(kind, { inStock: true, limit: 1 }),
  ]);
  const total = all.pagination.total;
  const available = inStock.pagination.total;
  const { href, title } = STORE_KINDS[kind];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={kind === "accessories" ? Package : Wrench}
        label={`Total ${title.toLowerCase()}`}
        value={total}
      />
      <StatCard
        icon={CircleCheck}
        label="In stock"
        value={available}
        href={`${href}?stock=in`}
      />
      <StatCard
        icon={CircleX}
        tone="danger"
        label="Out of stock"
        value={total - available}
        href={`${href}?stock=out`}
      />
    </div>
  );
}

async function StoreItemsTable({
  kind,
  page,
  stock,
  hrefForPage,
}: {
  kind: StoreKind;
  page: number;
  stock: (typeof STOCK_FILTERS)[number] | undefined;
  hrefForPage: (page: number) => string;
}) {
  const config = STORE_KINDS[kind];
  const Icon = kind === "accessories" ? Package : Wrench;
  const { items, pagination } = await getStoreItems(kind, {
    page,
    inStock: stock ? stock === "in" : undefined,
  });

  if (
    items.length === 0 &&
    pagination.totalPages > 0 &&
    page > pagination.totalPages
  ) {
    redirect(hrefForPage(pagination.totalPages));
  }

  if (items.length === 0) {
    return stock ? (
      <EmptyState
        icon={SearchX}
        title={`No ${stock === "in" ? "in-stock" : "out-of-stock"} ${config.plural}`}
        description="Try another filter."
      />
    ) : (
      <EmptyState
        icon={Icon}
        title={`No ${config.plural} yet`}
        description={`Add your first ${config.singular} to list it in the shop.`}
        action={<CreateButton label={`Add ${capitalize(config.singular)}`} />}
      />
    );
  }

  return (
    <>
      <Table className="min-w-220">
        <TableHead>
          <TH>{capitalize(config.singular)}</TH>
          <TH>Price</TH>
          <TH>Features</TH>
          <TH>Stock</TH>
          <TH align="right">Actions</TH>
        </TableHead>
        <tbody>
          {items.map((item) => (
            <TR key={item._id}>
              <TD>
                <div className="flex items-center gap-3">
                  <Thumbnail
                    src={item.imageUrl}
                    alt={item.name}
                    fallback={Icon}
                  />
                  <div className="max-w-64 min-w-0">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.description || (
                        <span className="font-mono text-subtle">
                          /{item.slug}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </TD>
              <TD className="font-semibold whitespace-nowrap text-white tabular-nums">
                {item.priceText}
              </TD>
              <TD>
                {item.features.length === 0 ? (
                  <span className="text-subtle">—</span>
                ) : (
                  <div className="flex max-w-xs flex-wrap gap-1.5">
                    {item.features.slice(0, 2).map((feature, index) => (
                      <span
                        key={index}
                        className="max-w-36 truncate rounded-md border border-line-strong bg-field px-2 py-1 text-[11px] text-ink-soft"
                      >
                        {feature}
                      </span>
                    ))}
                    {item.features.length > 2 && (
                      <span className="rounded-md px-1.5 py-1 text-[11px] text-muted">
                        +{item.features.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </TD>
              <TD>
                <Badge tone={item.inStock ? "brand" : "danger"} dot>
                  {item.inStock ? "In stock" : "Out of stock"}
                </Badge>
              </TD>
              <TD align="right">
                <RowActions item={item} name={item.name} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      <Pagination
        pagination={pagination}
        noun={config.plural}
        hrefForPage={hrefForPage}
      />
    </>
  );
}
