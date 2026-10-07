import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bike, SearchX, ShoppingBag } from "lucide-react";
import { Suspense } from "react";
import { OrderActions } from "@/app/admin/orders/order-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { Thumbnail } from "@/components/ui/thumbnail";
import { ORDER_STATUS_TONE, ORDER_STATUSES } from "@/lib/constants";
import { capitalize, formatDate, formatPKR, orderRef } from "@/lib/format";
import { getOrders } from "@/lib/server/queries";
import { hrefWith, parseOneOf, parsePage } from "@/lib/search-params";
import type { OrderStatus } from "@/types/api";

export const metadata: Metadata = { title: "Orders" };

const PATH = "/admin/orders";

export default async function OrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = parseOneOf(params.status, ORDER_STATUSES);
  const current = { status, page: page > 1 ? String(page) : undefined };
  const statusHref = (value: string | null) =>
    hrefWith(PATH, current, { status: value, page: null });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShoppingBag}
        eyebrow="Customers"
        title="Orders"
        description="Cash on delivery orders from the website. Confirm, ship and close them here."
      />

      <Panel>
        <PanelHeader
          title="All Orders"
          description="Newest first"
          toolbar={
            <FilterTabs
              label="Filter by status"
              layoutId="orders-status"
              activeHref={statusHref(status ?? null)}
              tabs={[
                { label: "All", href: statusHref(null) },
                ...ORDER_STATUSES.map((value) => ({
                  label: capitalize(value),
                  href: statusHref(value),
                })),
              ]}
            />
          }
        />

        <Suspense
          key={`${status}-${page}`}
          fallback={<TableSkeleton columns={6} />}
        >
          <OrdersTable
            page={page}
            status={status}
            hrefForPage={(target) =>
              hrefWith(PATH, current, { page: target > 1 ? target : null })
            }
          />
        </Suspense>
      </Panel>
    </div>
  );
}

async function OrdersTable({
  page,
  status,
  hrefForPage,
}: {
  page: number;
  status: OrderStatus | undefined;
  hrefForPage: (page: number) => string;
}) {
  const { orders, pagination } = await getOrders({ page, status });

  if (
    orders.length === 0 &&
    pagination.totalPages > 0 &&
    page > pagination.totalPages
  ) {
    redirect(hrefForPage(pagination.totalPages));
  }

  if (orders.length === 0) {
    return status ? (
      <EmptyState
        icon={SearchX}
        title={`No ${status} orders`}
        description="Try another status."
      />
    ) : (
      <EmptyState
        icon={ShoppingBag}
        title="No orders yet"
        description="Orders placed on the website will appear here."
      />
    );
  }

  return (
    <>
      <Table className="min-w-225">
        <TableHead>
          <TH>Order</TH>
          <TH>Customer</TH>
          <TH>Item</TH>
          <TH>Total</TH>
          <TH>Status</TH>
          <TH align="right">Actions</TH>
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
                  {order.shippingAddress.phoneNumber} ·{" "}
                  {order.shippingAddress.city}
                </p>
              </TD>
              <TD>
                <div className="flex items-center gap-3">
                  <Thumbnail
                    src={order.bike?.imageUrl}
                    alt=""
                    fallback={Bike}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-white">{order.bikeName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {order.quantity} × {formatPKR(order.unitPrice)}
                    </p>
                  </div>
                </div>
              </TD>
              <TD className="font-semibold whitespace-nowrap text-white tabular-nums">
                {formatPKR(order.totalAmount)}
              </TD>
              <TD>
                <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                  {capitalize(order.status)}
                </Badge>
              </TD>
              <TD align="right">
                <OrderActions order={order} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      <Pagination
        pagination={pagination}
        noun="orders"
        hrefForPage={hrefForPage}
      />
    </>
  );
}
