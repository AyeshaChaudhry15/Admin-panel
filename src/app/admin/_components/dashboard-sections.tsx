import Link from "next/link";
import {
  ArrowUpRight,
  Bike,
  CalendarCheck,
  MessageSquare,
  Package,
  PackageCheck,
  Plus,
  ShoppingBag,
  Tag,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { Thumbnail } from "@/components/ui/thumbnail";
import { toneTile } from "@/components/ui/tone";
import { ORDER_STATUS_TONE, type Tone } from "@/lib/constants";
import {
  capitalize,
  formatDate,
  formatNumber,
  formatPKR,
  orderRef,
} from "@/lib/format";
import {
  getBikes,
  getBrands,
  getOrders,
  getPendingCounts,
  getStoreItems,
} from "@/lib/server/queries";
import { cn } from "@/lib/utils";

export async function CatalogStats() {
  const [
    models,
    bikesOnly,
    brands,
    accessories,
    accessoriesInStock,
    parts,
    partsInStock,
  ] = await Promise.all([
    getBikes({ limit: 1 }),
    getBikes({ type: "bike", limit: 1 }),
    getBrands(),
    getStoreItems("accessories", { limit: 1 }),
    getStoreItems("accessories", { inStock: true, limit: 1 }),
    getStoreItems("spare-parts", { limit: 1 }),
    getStoreItems("spare-parts", { inStock: true, limit: 1 }),
  ]);

  const totalModels = models.pagination.total;
  const bikes = bikesOnly.pagination.total;
  const brandsWithProfile = brands.filter((brand) => brand.about).length;

  return (
    <StatGrid>
      <StatCard
        icon={Bike}
        label="Models"
        value={totalModels}
        hint={`${formatNumber(bikes)} bikes · ${formatNumber(totalModels - bikes)} scooters`}
        href="/admin/models"
      />
      <StatCard
        icon={Tag}
        label="Brands"
        value={brands.length}
        hint={`${formatNumber(brandsWithProfile)} with a full profile`}
        href="/admin/brands"
      />
      <StatCard
        icon={Package}
        label="Accessories"
        value={accessories.pagination.total}
        hint={`${formatNumber(accessoriesInStock.pagination.total)} in stock`}
        href="/admin/accessories"
      />
      <StatCard
        icon={Wrench}
        label="Spare Parts"
        value={parts.pagination.total}
        hint={`${formatNumber(partsInStock.pagination.total)} in stock`}
        href="/admin/spare-parts"
      />
    </StatGrid>
  );
}

export async function RecentModels() {
  const { bikes } = await getBikes({ limit: 5 });

  return (
    <Panel>
      <PanelHeader
        title="Recent Models"
        description="The latest bikes and scooters added to the catalog"
        link={{ href: "/admin/models", label: "View all" }}
      />

      {bikes.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="No models yet"
          description="Add your first bike or scooter to start building the catalog."
        />
      ) : (
        <Table className="min-w-130">
          <TableHead>
            <TH>Model</TH>
            <TH>Brand</TH>
            <TH>Type</TH>
            <TH>Price</TH>
            <TH align="right">Added</TH>
          </TableHead>
          <tbody>
            {bikes.map((bike) => (
              <TR key={bike._id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Thumbnail
                      src={bike.imageUrl}
                      alt={bike.name}
                      fallback={Bike}
                      size="sm"
                    />
                    <span className="font-medium text-white">{bike.name}</span>
                  </div>
                </TD>
                <TD>{bike.brand.displayName}</TD>
                <TD>
                  <Badge tone={bike.type === "bike" ? "brand" : "info"}>
                    {capitalize(bike.type)}
                  </Badge>
                </TD>
                <TD className="font-semibold whitespace-nowrap text-white tabular-nums">
                  {formatPKR(bike.price)}
                </TD>
                <TD align="right" className="whitespace-nowrap text-muted">
                  {formatDate(bike.createdAt)}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  );
}

const QUICK_ACTIONS: {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    href: "/admin/models?new=1",
    label: "Add Model",
    icon: Plus,
    tone: "brand",
  },
  { href: "/admin/brands?new=1", label: "Add Brand", icon: Tag, tone: "info" },
  {
    href: "/admin/accessories?new=1",
    label: "Add Accessory",
    icon: Package,
    tone: "info",
  },
  {
    href: "/admin/spare-parts?new=1",
    label: "Add Spare Part",
    icon: Wrench,
    tone: "info",
  },
  {
    href: "/admin/orders?status=pending",
    label: "New Orders",
    icon: ShoppingBag,
    tone: "info",
  },
  {
    href: "/admin/test-rides?status=pending",
    label: "Test Ride Requests",
    icon: CalendarCheck,
    tone: "info",
  },
  {
    href: "/admin/messages?status=pending",
    label: "Unread Messages",
    icon: MessageSquare,
    tone: "info",
  },
  {
    href: "/admin/models?type=scooter",
    label: "Browse Scooters",
    icon: Bike,
    tone: "info",
  },
];

export function QuickActions() {
  return (
    <Panel>
      <PanelHeader title="Quick Actions" />
      <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:p-5 xl:grid-cols-2">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-medium outline-none transition-[filter,box-shadow] hover:shadow-[0_6px_14px_rgba(0,0,0,0.35)] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-brand/60",
              toneTile[tone],
            )}
          >
            <Icon className="size-6" />
            <span className="text-ink-soft">{label}</span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export async function LatestOrders() {
  const { orders } = await getOrders({ limit: 5 });

  return (
    <Panel>
      <PanelHeader
        title="Latest Orders"
        description="Cash on delivery orders placed on the website"
        link={{ href: "/admin/orders", label: "View all" }}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Orders placed on the website will show up here."
        />
      ) : (
        <Table className="min-w-130">
          <TableHead>
            <TH>Order</TH>
            <TH>Customer</TH>
            <TH>Bike</TH>
            <TH>Total</TH>
            <TH align="right">Status</TH>
          </TableHead>
          <tbody>
            {orders.map((order) => (
              <TR key={order._id}>
                <TD>
                  <p className="font-mono text-xs font-semibold text-white">
                    {orderRef(order._id)}
                  </p>
                  <p className="mt-0.5 text-xs whitespace-nowrap text-muted">
                    {formatDate(order.createdAt)}
                  </p>
                </TD>
                <TD>
                  <p className="font-medium text-white">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {order.shippingAddress.city}
                  </p>
                </TD>
                <TD>
                  {order.bikeName}
                  {order.quantity > 1 && (
                    <span className="text-muted"> × {order.quantity}</span>
                  )}
                </TD>
                <TD className="font-semibold whitespace-nowrap text-white tabular-nums">
                  {formatPKR(order.totalAmount)}
                </TD>
                <TD align="right">
                  <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                    {capitalize(order.status)}
                  </Badge>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  );
}

export async function NeedsAttention() {
  const [counts, processing] = await Promise.all([
    getPendingCounts(),
    getOrders({ status: "processing", limit: 1 }),
  ]);

  const cards: {
    href: string;
    label: string;
    value: number | null;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    {
      href: "/admin/orders?status=pending",
      label: "Orders to confirm",
      value: counts.orders,
      icon: PackageCheck,
      tone: "warning",
    },
    {
      href: "/admin/orders?status=processing",
      label: "Orders in progress",
      value: processing.pagination.total,
      icon: Truck,
      tone: "brand",
    },
    {
      href: "/admin/test-rides?status=pending",
      label: "Test rides to review",
      value: counts.testRides,
      icon: CalendarCheck,
      tone: "violet",
    },
    {
      href: "/admin/messages?status=pending",
      label: "Unanswered messages",
      value: counts.messages,
      icon: MessageSquare,
      tone: "info",
    },
  ];

  return (
    <Panel>
      <PanelHeader
        title="Needs Attention"
        description="Customer requests waiting on you"
      />
      <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:p-5 xl:grid-cols-2">
        {cards.map(({ href, label, value, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex flex-col gap-3 rounded-xl p-4 outline-none transition-[filter] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-brand/60",
              toneTile[tone],
            )}
          >
            <div className="flex items-center justify-between">
              <Icon className="size-6" />
              <ArrowUpRight className="size-4 opacity-60 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              <p className="text-2xl leading-none font-bold text-white tabular-nums">
                {value === null ? "—" : formatNumber(value)}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-ink-soft">
                {label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
