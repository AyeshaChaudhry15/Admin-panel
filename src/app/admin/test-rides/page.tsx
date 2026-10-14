import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Bike,
  CalendarCheck,
  Mail,
  MessageCircle,
  SearchX,
} from "lucide-react";
import { Suspense } from "react";
import { TestRideActions } from "@/app/admin/test-rides/test-ride-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { Thumbnail } from "@/components/ui/thumbnail";
import {
  TEST_RIDE_STATUS_TONE,
  TEST_RIDE_STATUSES,
} from "@/lib/constants";
import {
  capitalize,
  formatCalendarDate,
  formatDate,
  formatTime,
} from "@/lib/format";
import { getTestRideRequests } from "@/lib/server/queries";
import { hrefWith, parseOneOf, parsePage } from "@/lib/search-params";
import { whatsAppUrl } from "@/lib/utils";
import type { TestRideStatus } from "@/types/api";

export const metadata: Metadata = { title: "Test Rides" };

const PATH = "/admin/test-rides";

export default async function TestRidesPage({
  searchParams,
}: PageProps<"/admin/test-rides">) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = parseOneOf(params.status, TEST_RIDE_STATUSES);
  const current = {
    status,
    page: page > 1 ? String(page) : undefined,
  };

  const statusHref = (value: string | null) =>
    hrefWith(PATH, current, {
      status: value,
      page: null,
    });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        eyebrow="Customers"
        title="Test Ride Requests"
        description="Visitors asking to try a bike. Accept or reject each request, then contact them."
      />

      <Panel>
        <PanelHeader
          title="All Requests"
          description="Newest first"
          toolbar={
            <FilterTabs
              label="Filter by status"
              layoutId="test-rides-status"
              activeHref={statusHref(status ?? null)}
              tabs={[
                {
                  label: "All",
                  href: statusHref(null),
                },
                ...TEST_RIDE_STATUSES.map((value) => ({
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
          <TestRidesTable
            page={page}
            status={status}
            hrefForPage={(target) =>
              hrefWith(PATH, current, {
                page: target > 1 ? target : null,
              })
            }
          />
        </Suspense>
      </Panel>
    </div>
  );
}

async function TestRidesTable({
  page,
  status,
  hrefForPage,
}: {
  page: number;
  status: TestRideStatus | undefined;
  hrefForPage: (page: number) => string;
}) {
  const { testRideRequests: requests, pagination } =
    await getTestRideRequests({
      page,
      status,
    });

  if (
    requests.length === 0 &&
    pagination.totalPages > 0 &&
    page > pagination.totalPages
  ) {
    redirect(hrefForPage(pagination.totalPages));
  }

  if (requests.length === 0) {
    return status ? (
      <EmptyState
        icon={SearchX}
        title={`No ${status} requests`}
        description="Try another status."
      />
    ) : (
      <EmptyState
        icon={CalendarCheck}
        title="No test ride requests yet"
        description="Requests made from a bike's page on the website will appear here."
      />
    );
  }

  return (
    <>
      <Table className="min-w-235">
        <TableHead>
          <TH>Requester</TH>
          <TH>Bike</TH>
          <TH>Preferred slot</TH>
          <TH>Status</TH>
          <TH>Received</TH>
          <TH align="right">Actions</TH>
        </TableHead>

        <tbody>
          {requests.map((request) => (
            <TR key={request._id}>
              <TD>
                <p className="font-medium text-white">
                  {request.requesterName}
                </p>

                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <a
                    href={whatsAppUrl(request.requesterWhatsApp)}
                    target="_blank"
                    rel="noreferrer"
                    title={request.requesterWhatsApp}
                    className="inline-flex items-center gap-1 rounded-md border border-[#FF8A00]/30 bg-[#FF8A00]/10 px-2 py-0.5 text-[11px] font-medium text-[#FF8A00] transition-colors hover:border-[#FF8A00]/50 hover:bg-[#FF8A00]/20"
                  >
                    <MessageCircle className="size-3" />
                    {request.requesterWhatsApp}
                  </a>

                  <a
                    href={`mailto:${request.requesterEmail}`}
                    title={request.requesterEmail}
                    className="inline-flex max-w-48 items-center gap-1 rounded-md border border-[#0057D9]/30 bg-[#0057D9]/10 px-2 py-0.5 text-[11px] font-medium text-[#6EA8FF] transition-colors hover:border-[#0057D9] hover:text-white"
                  >
                    <Mail className="size-3 shrink-0" />
                    <span className="truncate">
                      {request.requesterEmail}
                    </span>
                  </a>
                </div>
              </TD>

              <TD>
                <div className="flex items-center gap-3">
                  <Thumbnail
                    src={request.bike?.imageUrl}
                    alt=""
                    fallback={Bike}
                    size="sm"
                  />

                  <div className="min-w-0">
                    <p className="text-white">
                      {request.bike?.name ?? "Deleted bike"}
                    </p>

                    <p className="mt-0.5 text-xs text-muted">
                      {request.brand?.displayName ?? "—"}
                    </p>
                  </div>
                </div>
              </TD>

              <TD>
                <p className="whitespace-nowrap text-white">
                  {formatCalendarDate(request.preferredDate)}
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  {formatTime(request.preferredTime)} ·{" "}
                  {request.preferredCity}
                </p>
              </TD>

              <TD>
                <Badge
                  tone={TEST_RIDE_STATUS_TONE[request.status]}
                  dot
                >
                  {capitalize(request.status)}
                </Badge>

                {request.rejectionReason && (
                  <p
                    className="mt-1.5 line-clamp-2 max-w-56 text-xs text-muted"
                    title={request.rejectionReason}
                  >
                    {request.rejectionReason}
                  </p>
                )}
              </TD>

              <TD className="whitespace-nowrap text-muted">
                {formatDate(request.createdAt)}
              </TD>

              <TD align="right">
                {request.status === "pending" ? (
                  <TestRideActions request={request} />
                ) : (
                  <span className="text-xs text-subtle">
                    Reviewed
                  </span>
                )}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>

      <Pagination
        pagination={pagination}
        noun="requests"
        hrefForPage={hrefForPage}
      />
    </>
  );
}