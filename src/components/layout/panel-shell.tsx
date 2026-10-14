"use client";

import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { lockScroll } from "@/lib/scroll-lock";
import type { PendingCounts } from "@/types/admin";
import type { Admin } from "@/types/api";

interface PanelShellProps {
  admin: Admin;
  countsPromise: Promise<PendingCounts>;
  siteUrl?: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function PanelShell({
  admin,
  countsPromise,
  siteUrl,
  footer,
  children,
}: PanelShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;

    const desktop = window.matchMedia("(min-width: 64rem)");

    const onResize = () => {
      if (desktop.matches) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const unlockScroll = lockScroll();

    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      unlockScroll();
      desktop.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-[#071018] text-[#E8EBF2]">
      <a
        href="#main"
        className="sr-only z-60 rounded-lg bg-[#FF8A00] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[#1E2C38] lg:block">
        <Sidebar
          variant="desktop"
          countsPromise={countsPromise}
          siteUrl={siteUrl}
        />
      </aside>

      <AnimatePresence>
        {menuOpen && (
          <>
            <m.div
              key="backdrop"
              aria-hidden
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-[#00101F]/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <m.aside
              key="drawer"
              id="mobile-nav"
              aria-label="Navigation"
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 42,
              }}
            >
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                className="absolute top-4 right-3 z-10 flex size-9 items-center justify-center rounded-lg text-[#C3CCD6] transition-colors hover:bg-[#0057D9]/10 hover:text-[#FF8A00]"
              >
                <X className="size-5" />
              </button>

              <Sidebar
                variant="mobile"
                countsPromise={countsPromise}
                siteUrl={siteUrl}
                onNavigate={closeMenu}
              />
            </m.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-dvh flex-col bg-[#071018] lg:pl-60">
        <Topbar
          admin={admin}
          countsPromise={countsPromise}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main
          id="main"
          className="mx-auto w-full max-w-350 flex-1 bg-[#071018] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>

        {footer}
      </div>
    </div>
  );
}