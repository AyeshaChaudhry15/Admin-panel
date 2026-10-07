"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  Menu,
  MessageSquare,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Suspense, use } from "react";
import { findNavItem } from "@/components/layout/nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Dropdown } from "@/components/ui/dropdown";
import { toneTile } from "@/components/ui/tone";
import { cn, initials } from "@/lib/utils";
import type { PendingCounts } from "@/types/admin";
import type { Admin } from "@/types/api";

interface TopbarProps {
  admin: Admin;
  countsPromise: Promise<PendingCounts>;
  menuOpen: boolean;
  onOpenMenu: () => void;
}

export function Topbar({
  admin,
  countsPromise,
  menuOpen,
  onOpenMenu,
}: TopbarProps) {
  const pathname = usePathname();
  const current = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="-ml-1 flex size-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="size-5.5" />
        </button>

        {current && (
          <p className="truncate text-sm">
            <span className="hidden text-subtle sm:inline">
              {current.section} /{" "}
            </span>
            <span className="font-medium text-ink-soft">
              {current.item.label}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <Suspense fallback={<BellIcon total={0} />}>
          <Notifications countsPromise={countsPromise} />
        </Suspense>
        <UserMenu admin={admin} />
      </div>
    </header>
  );
}

function BellIcon({ total }: { total: number }) {
  return (
    <span className="relative flex size-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-white/5 hover:text-white">
      <Bell className="size-5" />
      {total > 0 && (
        <span className="absolute top-1 right-1 flex min-w-4.5 items-center justify-center rounded-full border-2 border-surface bg-danger px-1 text-[10px] leading-4 font-bold text-white tabular-nums">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </span>
  );
}

const NOTIFICATIONS = [
  {
    key: "orders",
    href: "/admin/orders?status=pending",
    icon: ShoppingBag,
    tone: "warning",
    label: (count: number) =>
      `${count} new ${count === 1 ? "order" : "orders"} to confirm`,
  },
  {
    key: "testRides",
    href: "/admin/test-rides?status=pending",
    icon: CalendarCheck,
    tone: "violet",
    label: (count: number) =>
      `${count} test ride ${count === 1 ? "request" : "requests"} to review`,
  },
  {
    key: "messages",
    href: "/admin/messages?status=pending",
    icon: MessageSquare,
    tone: "info",
    label: (count: number) =>
      `${count} unanswered ${count === 1 ? "message" : "messages"}`,
  },
] as const;

function Notifications({
  countsPromise,
}: {
  countsPromise: Promise<PendingCounts>;
}) {
  const counts = use(countsPromise);
  const items = NOTIFICATIONS.filter((item) => (counts[item.key] ?? 0) > 0);
  const total = items.reduce((sum, item) => sum + (counts[item.key] ?? 0), 0);

  return (
    <Dropdown
      label={total > 0 ? `Notifications, ${total} pending` : "Notifications"}
      trigger={<BellIcon total={total} />}
      triggerClassName="rounded-lg"
      panelClassName="w-80 max-w-[calc(100vw-2rem)]"
    >
      {(close) => (
        <div>
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <p className="text-xs text-muted">
              Requests waiting for your review
            </p>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="p-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-ink-soft transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          toneTile[item.tone],
                        )}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      {item.label(counts[item.key] ?? 0)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Dropdown>
  );
}

function UserMenu({ admin }: { admin: Admin }) {
  return (
    <Dropdown
      label="Account menu"
      triggerClassName="flex items-center gap-2.5 rounded-xl py-1 pr-1 pl-1 text-sm text-ink-soft transition-colors hover:text-white sm:pr-2"
      panelClassName="w-60"
      trigger={
        <>
          <span className="flex size-9 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-xs font-bold text-brand">
            {initials(admin.fullName)}
          </span>
          <span className="hidden max-w-36 truncate font-medium md:inline">
            {admin.fullName}
          </span>
          <ChevronDown className="hidden size-4 text-muted sm:block" />
        </>
      }
    >
      {(close) => (
        <div>
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {admin.fullName}
            </p>
            <p className="truncate text-xs text-muted">{admin.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              href="/admin/profile"
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-white/5 hover:text-white"
            >
              <UserRound className="size-4" />
              Profile & security
            </Link>
            <LogoutButton className="rounded-lg px-2.5 py-2 text-sm text-danger/90 hover:bg-danger/10 hover:text-danger" />
          </div>
        </div>
      )}
    </Dropdown>
  );
}
