import type { Metadata } from "next";
import { StoreItemsPage } from "@/components/store-items/store-items-page";

export const metadata: Metadata = { title: "Accessories" };

export default async function AccessoriesPage({ searchParams }: PageProps<"/admin/accessories">) {
  return <StoreItemsPage kind="accessories" params={await searchParams} />;
}
