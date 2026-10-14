"use client";

import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Suspense, use } from "react";

import {
  LogoutButton,
} from "@/components/layout/logout-button";

import {
  isActive,
  NAV_SECTIONS,
  type NavItem,
} from "@/components/layout/nav";

import type { PendingCounts } from "@/types/admin";
import { cn } from "@/lib/utils";

interface SidebarProps {
  variant: "desktop" | "mobile";
  countsPromise: Promise<PendingCounts>;
  siteUrl?: string;
  onNavigate?: () => void;
}

export function Sidebar({
  variant,
  countsPromise,
  siteUrl,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-canvas text-white">
      {/* LOGO */}
      <div className="border-b border-line px-6 pt-5 pb-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        >
          <Image
            src="/evinn-logo.png"
            alt="EVINN"
            width={125}
            height={42}
            priority
            className="h-auto w-[125px] object-contain"
          />
        </Link>

      </div>

      <nav
        aria-label="Main"
        className="flex-1 overflow-y-auto pr-3 pb-4 [scrollbar-color:var(--color-line-strong)_transparent] scrollbar-thin"
      >
        {NAV_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="mt-5 first:mt-1"
          >
            <p className="px-6 pb-2 text-[10px] font-bold tracking-[0.18em] text-subtle uppercase">
              {section.title}
            </p>

            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={isActive(
                      pathname,
                      item,
                    )}
                    layoutId={`${variant}-nav-active`}
                    countsPromise={
                      countsPromise
                    }
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 overflow-hidden border-t border-line px-5 pt-4 pb-5">
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex h-11 items-center justify-between rounded-xl border border-line-strong bg-surface-raised px-4 text-sm text-ink-soft transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-brand"
          >
            View Website

            <ExternalLink className="size-4 text-brand" />
          </a>
        )}

        <LogoutButton className="relative z-10 rounded-lg px-1 py-2.5 text-sm text-ink-soft hover:bg-brand/10 hover:text-brand" />

        <div
          aria-hidden
          className="pointer-events-none absolute -right-1 -bottom-2 -scale-x-100 opacity-60"
        >
          <Image
            src="/evee1.png"
            alt=""
            width={115}
            height={120}
            loading="eager"
          />
        </div>

        <p className="relative mt-1 flex flex-col text-xl leading-tight font-bold italic">
          Drive

          <span className="mt-0.5 text-[15px] font-medium text-brand">
            Greener Tomorrow
          </span>
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  layoutId,
  countsPromise,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  layoutId: string;
  countsPromise: Promise<PendingCounts>;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={
        active ? "page" : undefined
      }
      className={cn(
        "relative flex h-11 items-center gap-3.5 rounded-r-xl pr-3 pl-6 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-inset",

        active
          ? "font-semibold text-white"
          : "text-ink-soft hover:bg-brand/10 hover:text-white",
      )}
    >
      {active && (
        <m.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-r-xl bg-brand/15 shadow-[inset_4px_0_0_#FF8A00]"
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 38,
          }}
        />
      )}

      <Icon
        className={cn(
          "relative size-5 shrink-0",

          active
            ? "text-brand"
            : "text-muted group-hover:text-brand",
        )}
      />

      <span className="relative flex-1 truncate">
        {item.label}
      </span>

      {item.badge && (
        <Suspense fallback={null}>
          <NavBadge
            countsPromise={countsPromise}
            name={item.badge}
          />
        </Suspense>
      )}
    </Link>
  );
}

function NavBadge({
  countsPromise,
  name,
}: {
  countsPromise: Promise<PendingCounts>;
  name: keyof PendingCounts;
}) {
  const count =
    use(countsPromise)[name];

  if (!count) return null;

  return (
    <span
      className="relative min-w-6 rounded-full bg-brand px-1.5 py-0.5 text-center text-[10px] font-bold text-brand-ink tabular-nums"
      aria-label={`${count} pending`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}