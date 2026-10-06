import type { Metadata } from "next";
import { StoreItemsPage } from "@/components/store-items/store-items-page";

export const metadata: Metadata = { title: "Spare Parts" };

export default async function SparePartsPage({ searchParams }: PageProps<"/admin/spare-parts">) {
  return <StoreItemsPage kind="spare-parts" params={await searchParams} />;
}
