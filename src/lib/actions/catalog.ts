"use server";

import {
  BIKE_SPEC_FIELDS,
  BIKE_TYPES,
  MAX_FEATURES,
  SLUG_PATTERN,
} from "@/lib/constants";
import {
  assertId,
  InputError,
  readImage,
  readNumber,
  readText,
  requestBody,
  runAction,
} from "@/lib/server/action-utils";
import { api } from "@/lib/server/http";
import { isStoreKind, STORE_KINDS, type StoreKind } from "@/lib/store-kinds";
import { capitalize } from "@/lib/format";
import { isObjectId } from "@/lib/utils";
import type { ActionResult } from "@/types/actions";
import type {
  AccessoryInput,
  BikeInput,
  BikeSpecs,
  BikeType,
  BrandInput,
  MessageResponse,
} from "@/types/api";

const slugRegex = new RegExp(`^${SLUG_PATTERN}$`);

function readSlug(formData: FormData) {
  const slug = readText(formData, "slug").toLowerCase();
  if (slug && !slugRegex.test(slug)) {
    throw new InputError(
      "Slug may only contain lowercase letters, numbers and single hyphens.",
    );
  }
  return slug;
}

function readPrice(formData: FormData) {
  const price = readNumber(formData, "price");
  if (!Number.isFinite(price) || price < 0)
    throw new InputError("Enter a valid price of 0 or more.");
  return price;
}

async function deleteRecord(path: string, id: string) {
  return runAction(async () => {
    const { message } = await api<MessageResponse>(`${path}/${assertId(id)}`, {
      method: "DELETE",
    });
    return message;
  });
}

const BRAND_FIELDS = [
  "displayName",
  "origin",
  "established",
  "headquarters",
  "about",
  "websiteUrl",
  "instagramUrl",
  "twitterUrl",
  "facebookUrl",
] as const;

export async function saveBrand(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const fields = Object.fromEntries(
      BRAND_FIELDS.map((key) => [key, readText(formData, key)]),
    ) as Required<BrandInput>;

    if (!fields.displayName) throw new InputError("Brand name is required.");

    const logo = readImage(formData, "logo");

    if (id === null) {
      if (!logo) throw new InputError("Brand logo is required.");
      await api("/brands", {
        method: "POST",
        body: requestBody(fields, { logo }),
      });
      return `${fields.displayName} was added.`;
    }

    await api(`/brands/${assertId(id)}`, {
      method: "PATCH",
      body: requestBody(fields, { logo }),
    });
    return `${fields.displayName} was updated.`;
  });
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  return deleteRecord("/brands", id);
}

export async function saveBike(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const name = readText(formData, "name");
    const brand = readText(formData, "brand");
    const type = readText(formData, "type") as BikeType;
    const ratingValue = readText(formData, "rating");
    const rating = ratingValue === "" ? 0 : Number(ratingValue);

    if (!name) throw new InputError("Model name is required.");
    if (!isObjectId(brand)) throw new InputError("Select a brand.");
    if (!BIKE_TYPES.includes(type))
      throw new InputError("Select whether this is a bike or a scooter.");
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      throw new InputError("Rating must be between 0 and 5.");
    }

    const fields: BikeInput = {
      name,
      brand,
      type,
      price: readPrice(formData),
      rating,
      specs: Object.fromEntries(
        BIKE_SPEC_FIELDS.map(({ key }) => [
          key,
          readText(formData, `specs.${key}`),
        ]),
      ) as unknown as BikeSpecs,
    };

    const slug = readSlug(formData);
    if (slug || id !== null) fields.slug = slug;

    const image = readImage(formData, "image");

    if (id === null) {
      if (!image) throw new InputError("Model image is required.");
      await api("/bikes", {
        method: "POST",
        body: requestBody(fields, { image }),
      });
      return `${name} was added.`;
    }

    await api(`/bikes/${assertId(id)}`, {
      method: "PATCH",
      body: requestBody(fields, { image }),
    });
    return `${name} was updated.`;
  });
}

export async function deleteBike(id: string): Promise<ActionResult> {
  return deleteRecord("/bikes", id);
}

export async function saveStoreItem(
  kind: StoreKind,
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    if (!isStoreKind(kind)) throw new InputError("Unknown product type.");
    const { apiPath, singular } = STORE_KINDS[kind];

    const name = readText(formData, "name");
    if (!name) throw new InputError("Name is required.");

    const features = formData
      .getAll("features")
      .map((feature) => String(feature).trim())
      .filter(Boolean);

    if (features.length > MAX_FEATURES) {
      throw new InputError(`At most ${MAX_FEATURES} features are allowed.`);
    }

    const fields: AccessoryInput = {
      name,
      price: readPrice(formData),
      description: readText(formData, "description"),
      features,
      inStock: formData.get("inStock") === "true",
    };

    const slug = readSlug(formData);
    if (slug || id !== null) fields.slug = slug;

    const image = readImage(formData, "image");

    if (id === null) {
      if (!image) throw new InputError("Image is required.");
      await api(apiPath, {
        method: "POST",
        body: requestBody(fields, { image }),
      });
      return `${capitalize(singular)} "${name}" was added.`;
    }

    await api(`${apiPath}/${assertId(id)}`, {
      method: "PATCH",
      body: requestBody(fields, { image }),
    });
    return `${capitalize(singular)} "${name}" was updated.`;
  });
}

export async function deleteStoreItem(
  kind: StoreKind,
  id: string,
): Promise<ActionResult> {
  if (!isStoreKind(kind)) return { ok: false, error: "Unknown product type." };
  return deleteRecord(STORE_KINDS[kind].apiPath, id);
}
