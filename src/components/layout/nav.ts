import {
  Bike,
  CalendarCheck,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  Tag,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { PendingCounts } from "@/types/admin";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only highlight on an exact path match. */
  exact?: boolean;
  /** Pending-count badge to show next to the item. */
  badge?: keyof PendingCounts;
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/brands", label: "Brands", icon: Tag },
      { href: "/admin/models", label: "Models", icon: Bike },
      { href: "/admin/accessories", label: "Accessories", icon: Package },
      { href: "/admin/spare-parts", label: "Spare Parts", icon: Wrench },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "orders" },
      { href: "/admin/test-rides", label: "Test Rides", icon: CalendarCheck, badge: "testRides" },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/admin/profile", label: "Profile", icon: UserRound }],
  },
];

export function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findNavItem(pathname: string) {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((entry) => isActive(pathname, entry));
    if (item) return { section: section.title, item };
  }
  return null;
}
