export const STORE_KINDS = {
  accessories: {
    apiPath: "/accessories",
    href: "/admin/accessories",
    title: "Accessories",
    singular: "accessory",
    plural: "accessories",
    description: "Manage riding gear and add-ons sold alongside your bikes.",
  },
  "spare-parts": {
    apiPath: "/spare-parts",
    href: "/admin/spare-parts",
    title: "Spare Parts",
    singular: "spare part",
    plural: "spare parts",
    description:
      "Manage replacement parts such as batteries, chargers and tyres.",
  },
} as const;

export type StoreKind = keyof typeof STORE_KINDS;

export function isStoreKind(value: unknown): value is StoreKind {
  return typeof value === "string" && Object.hasOwn(STORE_KINDS, value);
}
