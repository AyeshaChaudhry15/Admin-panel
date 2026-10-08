import type {
  BikeListQuery,
  BikeSpecs,
  BikeType,
  ContactReason,
  ContactStatus,
  OrderStatus,
  TestRideStatus,
} from "@/types/api";

export const SESSION_COOKIE = "accessToken";

export const SESSION_MAX_AGE = 60 * 60;

export const PAGE_SIZE = 10;

export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/admin";

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const SLUG_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const MAX_FEATURES = 20;

export const BIKE_TYPES: readonly BikeType[] = ["bike", "scooter"];

export const BIKE_SPEC_FIELDS: readonly {
  key: keyof BikeSpecs;
  label: string;
  placeholder: string;
  unit?: string;
}[] = [
  { key: "range", label: "Range", placeholder: "e.g. 70", unit: "km" },
  { key: "topSpeed", label: "Top speed", placeholder: "e.g. 65", unit: "km/h" },
  { key: "battery", label: "Battery", placeholder: "e.g. 72V 30Ah" },
  { key: "chargingTime", label: "Charging time", placeholder: "e.g. 4.5", unit: "hrs" },
  { key: "motorPower", label: "Motor power", placeholder: "e.g. 3000", unit: "W" },
  { key: "weight", label: "Weight", placeholder: "e.g. 115", unit: "kg" },
  { key: "warranty", label: "Warranty", placeholder: "e.g. 2 Years" },
];

type BikeNumberKey = Exclude<
  keyof BikeListQuery,
  "page" | "limit" | "search" | "brand" | "type"
>;

export const BIKE_NUMBER_FILTERS: readonly {
  label: string;
  unit: string;
  min: BikeNumberKey;
  max: BikeNumberKey;
}[] = [
  { label: "Price", unit: "PKR", min: "minPrice", max: "maxPrice" },
  { label: "Top speed", unit: "km/h", min: "minTopSpeed", max: "maxTopSpeed" },
  { label: "Range", unit: "km", min: "minRange", max: "maxRange" },
];

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "processing",
  "delivered",
  "completed",
  "cancelled",
  "rejected",
];

export const FINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  "completed",
  "cancelled",
  "rejected",
];

export const TEST_RIDE_STATUSES: readonly TestRideStatus[] = [
  "pending",
  "accepted",
  "rejected",
];

export const CONTACT_STATUSES: readonly ContactStatus[] = [
  "pending",
  "in process",
  "answered",
];

export const CONTACT_REASONS: readonly ContactReason[] = [
  "Product Inquiry",
  "Business Inquiry",
  "Support",
  "General Inquiry",
];

export type Tone =
  | "brand"
  | "info"
  | "violet"
  | "warning"
  | "danger"
  | "neutral";

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  processing: "info",
  delivered: "violet",
  completed: "brand",
  cancelled: "neutral",
  rejected: "danger",
};

export const TEST_RIDE_STATUS_TONE: Record<TestRideStatus, Tone> = {
  pending: "warning",
  accepted: "brand",
  rejected: "danger",
};

export const CONTACT_STATUS_TONE: Record<ContactStatus, Tone> = {
  pending: "warning",
  "in process": "info",
  answered: "brand",
};
