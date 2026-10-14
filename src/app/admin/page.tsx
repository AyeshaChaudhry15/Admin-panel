import type { Metadata } from "next";
import { CalendarDays, LayoutDashboard } from "lucide-react";
import { Suspense } from "react";
import {
  CatalogStats,
  LatestOrders,
  NeedsAttention,
  QuickActions,
  RecentModels,
} from "@/app/admin/_components/dashboard-sections";
import { SectionBoundary } from "@/components/section-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { PanelSkeleton, StatsSkeleton } from "@/components/ui/skeleton";
import { formatToday } from "@/lib/format";
import { requireAdmin } from "@/lib/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const firstName = admin.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description={`Welcome back, ${firstName}. Manage your products, brands, orders and customer requests.`}
        actions={
          <span className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-[#0057D9]/30 bg-[#0057D9]/10 px-4 text-sm text-[#DCE9FF]">
            <CalendarDays className="size-4 text-[#FF8A00]" />
            {formatToday()}
          </span>
        }
      />

      <SectionBoundary title="catalog stats">
        <Suspense fallback={<StatsSkeleton />}>
          <CatalogStats />
        </Suspense>
      </SectionBoundary>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <SectionBoundary title="recent models">
          <Suspense fallback={<PanelSkeleton />}>
            <RecentModels />
          </Suspense>
        </SectionBoundary>
        <QuickActions />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <SectionBoundary title="latest orders">
          <Suspense fallback={<PanelSkeleton />}>
            <LatestOrders />
          </Suspense>
        </SectionBoundary>
        <SectionBoundary title="pending requests">
          <Suspense fallback={<PanelSkeleton rows={2} />}>
            <NeedsAttention />
          </Suspense>
        </SectionBoundary>
      </div>
    </div>
  );
}