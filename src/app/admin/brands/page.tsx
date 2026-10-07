import type { Metadata } from "next";
import { FileWarning, Globe, SearchX, Tag } from "lucide-react";
import { BrandsManager } from "@/app/admin/brands/brands-manager";
import { CreateButton, RowActions } from "@/components/crud";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { Thumbnail } from "@/components/ui/thumbnail";
import { formatDate, pluralize } from "@/lib/format";
import { getBrands } from "@/lib/server/queries";
import { firstParam } from "@/lib/search-params";
import type { Brand } from "@/types/api";

export const metadata: Metadata = { title: "Brands" };

const LINKS = [
  { key: "websiteUrl", label: "Web" },
  { key: "instagramUrl", label: "IG" },
  { key: "twitterUrl", label: "X" },
  { key: "facebookUrl", label: "FB" },
] as const;

const hasLink = (value: string) => /^https?:\/\//i.test(value);

export default async function BrandsPage({
  searchParams,
}: PageProps<"/admin/brands">) {
  const params = await searchParams;
  const query = firstParam(params.q)?.trim() ?? "";
  const brands = await getBrands();

  const needle = query.toLowerCase();
  const visible = needle
    ? brands.filter((brand) =>
        [brand.displayName, brand.origin, brand.headquarters].some((value) =>
          value.toLowerCase().includes(needle),
        ),
      )
    : brands;

  const origins = new Set(
    brands.map((brand) => brand.origin.trim().toLowerCase()).filter(Boolean),
  );
  const incomplete = brands.filter(
    (brand) => !brand.about || !brand.origin,
  ).length;

  return (
    <BrandsManager initialCreate={firstParam(params.new) === "1"}>
      <div className="space-y-6">
        <PageHeader
          icon={Tag}
          eyebrow="Catalog"
          title="Brands"
          description="Manage the electric vehicle brands shown on the website."
          actions={<CreateButton label="Add Brand" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Tag} label="Total brands" value={brands.length} />
          <StatCard
            icon={Globe}
            tone="info"
            label="Places of origin"
            value={origins.size}
          />
          <StatCard
            icon={FileWarning}
            tone="warning"
            label="Profiles missing details"
            value={incomplete}
            hint="No origin or about text yet"
          />
        </div>

        <Panel>
          <PanelHeader
            title="All Brands"
            description={
              query
                ? `${pluralize(visible.length, "brand")} matching “${query}”`
                : pluralize(brands.length, "brand")
            }
            toolbar={
              <SearchField
                basePath="/admin/brands"
                defaultValue={query}
                placeholder="Search by name, origin or city"
              />
            }
          />

          {visible.length === 0 ? (
            query ? (
              <EmptyState
                icon={SearchX}
                title="No brands found"
                description="Try a different name, origin or city."
              />
            ) : (
              <EmptyState
                icon={Tag}
                title="No brands yet"
                description="Add your first brand, then attach models to it."
                action={<CreateButton label="Add Brand" />}
              />
            )
          ) : (
            <BrandsTable brands={visible} />
          )}
        </Panel>
      </div>
    </BrandsManager>
  );
}

function BrandsTable({ brands }: { brands: Brand[] }) {
  return (
    <Table className="min-w-205">
      <TableHead>
        <TH>Brand</TH>
        <TH>Headquarters</TH>
        <TH>Established</TH>
        <TH>Links</TH>
        <TH>Updated</TH>
        <TH align="right">Actions</TH>
      </TableHead>
      <tbody>
        {brands.map((brand) => {
          const links = LINKS.filter((link) => hasLink(brand[link.key]));

          return (
            <TR key={brand._id}>
              <TD>
                <div className="flex items-center gap-3">
                  <Thumbnail
                    src={brand.logoUrl}
                    alt={`${brand.displayName} logo`}
                    fallback={Tag}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {brand.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {brand.origin || "Origin not set"}
                    </p>
                  </div>
                </div>
              </TD>
              <TD>
                {brand.headquarters || <span className="text-subtle">—</span>}
              </TD>
              <TD>
                {brand.established || <span className="text-subtle">—</span>}
              </TD>
              <TD>
                {links.length === 0 ? (
                  <span className="text-subtle">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {links.map((link) => (
                      <a
                        key={link.key}
                        href={brand[link.key]}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-line-strong bg-field px-2 py-1 text-[11px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </TD>
              <TD className="whitespace-nowrap text-muted">
                {formatDate(brand.updatedAt)}
              </TD>
              <TD align="right">
                <RowActions item={brand} name={brand.displayName} />
              </TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}
