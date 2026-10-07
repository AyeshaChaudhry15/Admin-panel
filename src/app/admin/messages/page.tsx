import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare, SearchX } from "lucide-react";
import { Suspense } from "react";
import {
  MessageActions,
  MessageStatusSelect,
} from "@/app/admin/messages/message-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs, SelectFilter } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableHead, TD, TH, TR } from "@/components/ui/table";
import { CONTACT_REASONS, CONTACT_STATUSES } from "@/lib/constants";
import { capitalize, formatDate } from "@/lib/format";
import { getContactSubmissions } from "@/lib/server/queries";
import { hrefWith, parseOneOf, parsePage } from "@/lib/search-params";
import type { ContactSubmissionListQuery } from "@/types/api";

export const metadata: Metadata = { title: "Messages" };

const PATH = "/admin/messages";

export default async function MessagesPage({
  searchParams,
}: PageProps<"/admin/messages">) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = parseOneOf(params.status, CONTACT_STATUSES);
  const reason = parseOneOf(params.reason, CONTACT_REASONS);
  const current = { status, reason, page: page > 1 ? String(page) : undefined };
  const filterHref = (patch: Record<string, string | null>) =>
    hrefWith(PATH, current, { ...patch, page: null });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        eyebrow="Customers"
        title="Messages"
        description="Contact form submissions from the website. Reply by email, then mark them answered."
      />

      <Panel>
        <PanelHeader
          title="Inbox"
          description="Newest first"
          toolbar={
            <>
              <FilterTabs
                label="Filter by status"
                layoutId="messages-status"
                activeHref={filterHref({})}
                tabs={[
                  { label: "All", href: filterHref({ status: null }) },
                  ...CONTACT_STATUSES.map((value) => ({
                    label: capitalize(value),
                    href: filterHref({ status: value }),
                  })),
                ]}
              />
              <SelectFilter
                label="Filter by reason"
                value={reason ?? ""}
                options={[
                  { value: "", label: "All reasons" },
                  ...CONTACT_REASONS.map((value) => ({ value, label: value })),
                ]}
                hrefs={Object.fromEntries([
                  ["", filterHref({ reason: null })],
                  ...CONTACT_REASONS.map((value) => [
                    value,
                    filterHref({ reason: value }),
                  ]),
                ])}
              />
            </>
          }
        />

        <Suspense
          key={`${status}-${reason}-${page}`}
          fallback={<TableSkeleton columns={5} />}
        >
          <MessagesTable
            query={{ page, status, reason }}
            filtered={Boolean(status || reason)}
            hrefForPage={(target) =>
              hrefWith(PATH, current, { page: target > 1 ? target : null })
            }
          />
        </Suspense>
      </Panel>
    </div>
  );
}

async function MessagesTable({
  query,
  filtered,
  hrefForPage,
}: {
  query: ContactSubmissionListQuery & { page: number };
  filtered: boolean;
  hrefForPage: (page: number) => string;
}) {
  const { submissions, pagination } = await getContactSubmissions(query);

  if (
    submissions.length === 0 &&
    pagination.totalPages > 0 &&
    query.page > pagination.totalPages
  ) {
    redirect(hrefForPage(pagination.totalPages));
  }

  if (submissions.length === 0) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="No messages match"
        description="Try another status or reason."
      />
    ) : (
      <EmptyState
        icon={MessageSquare}
        title="Inbox is empty"
        description="Messages sent through the website's contact form will appear here."
      />
    );
  }

  return (
    <>
      <Table className="min-w-225">
        <TableHead>
          <TH>From</TH>
          <TH>Reason</TH>
          <TH>Message</TH>
          <TH>Received</TH>
          <TH>Status</TH>
          <TH align="right">Actions</TH>
        </TableHead>
        <tbody>
          {submissions.map((message) => (
            <TR key={message._id}>
              <TD>
                <p className="font-medium text-white">{message.fullName}</p>
                <p className="mt-0.5 max-w-52 truncate text-xs text-muted">
                  {message.email}
                </p>
              </TD>
              <TD>
                <Badge tone="neutral">{message.reason}</Badge>
              </TD>
              <TD>
                <p className="line-clamp-2 max-w-sm text-sm text-ink-soft">
                  {message.message || (
                    <span className="text-subtle italic">No message</span>
                  )}
                </p>
              </TD>
              <TD className="whitespace-nowrap text-muted">
                {formatDate(message.createdAt)}
              </TD>
              <TD>
                <MessageStatusSelect message={message} />
              </TD>
              <TD align="right">
                <MessageActions message={message} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      <Pagination
        pagination={pagination}
        noun="messages"
        hrefForPage={hrefForPage}
      />
    </>
  );
}
