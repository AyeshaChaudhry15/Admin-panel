import "server-only";

import { cache } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import { api, ApiError, type RequestOptions } from "@/lib/server/http";
import { STORE_KINDS, type StoreKind } from "@/lib/store-kinds";
import type { PendingCounts } from "@/types/admin";
import type {
  AccessoryListResponse,
  BikeListQuery,
  BikeListResponse,
  BrandListResponse,
  ContactSubmissionListQuery,
  ContactSubmissionListResponse,
  OrderListQuery,
  OrderListResponse,
  Pagination,
  SparePartListResponse,
  StoreItem,
  StoreItemListQuery,
  TestRideRequestListQuery,
  TestRideRequestListResponse,
} from "@/types/api";

type Options = Pick<RequestOptions, "onUnauthorized">;

/** All brands, alphabetical. Not paginated by the API. */
export const getBrands = cache(async () => {
  const { brands } = await api<BrandListResponse>("/brands");
  return brands;
});

export function getBikes(query: BikeListQuery = {}, options?: Options) {
  return api<BikeListResponse>("/bikes", {
    ...options,
    query: { limit: PAGE_SIZE, ...query },
  });
}

export async function getStoreItems(
  kind: StoreKind,
  query: StoreItemListQuery = {},
  options?: Options,
): Promise<{ items: StoreItem[]; pagination: Pagination }> {
  const data = await api<Partial<AccessoryListResponse & SparePartListResponse>>(
    STORE_KINDS[kind].apiPath,
    { ...options, query: { limit: PAGE_SIZE, ...query } },
  );

  return {
    items: (kind === "accessories" ? data.accessories : data.spareParts) ?? [],
    pagination: data.pagination!,
  };
}

export function getOrders(query: OrderListQuery = {}, options?: Options) {
  return api<OrderListResponse>("/orders", {
    ...options,
    query: { limit: PAGE_SIZE, ...query },
  });
}

export function getTestRideRequests(query: TestRideRequestListQuery = {}, options?: Options) {
  return api<TestRideRequestListResponse>("/test-ride-requests", {
    ...options,
    query: { limit: PAGE_SIZE, ...query },
  });
}

export function getContactSubmissions(query: ContactSubmissionListQuery = {}, options?: Options) {
  return api<ContactSubmissionListResponse>("/contact-submissions", {
    ...options,
    query: { limit: PAGE_SIZE, ...query },
  });
}

/** Resolves to the list's total, or `null` if the API call failed. */
async function totalOf(request: Promise<{ pagination: Pagination }>) {
  try {
    return (await request).pagination.total;
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

/**
 * Items waiting for the admin. Failures resolve to `null` instead of
 * throwing, so a single broken endpoint never takes down the whole panel.
 */
export const getPendingCounts = cache(async (): Promise<PendingCounts> => {
  const options: Options = { onUnauthorized: "throw" };
  const query = { status: "pending", limit: 1 } as const;

  const [orders, testRides, messages] = await Promise.all([
    totalOf(getOrders(query, options)),
    totalOf(getTestRideRequests(query, options)),
    totalOf(getContactSubmissions(query, options)),
  ]);

  return { orders, testRides, messages };
});
