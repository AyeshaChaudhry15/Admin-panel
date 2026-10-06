import "server-only";

import { revalidatePath } from "next/cache";
import { DASHBOARD_PATH } from "@/lib/constants";
import { ApiError } from "@/lib/server/http";
import { isObjectId, validateImage } from "@/lib/utils";
import type { ActionResult } from "@/types/actions";

/** Invalid input caught before calling the API; its message is shown to the admin. */
export class InputError extends Error {}

/** Re-renders every admin page (and the sidebar badges) with fresh data. */
export function refreshAdmin() {
  revalidatePath(DASHBOARD_PATH, "layout");
}

/**
 * Runs a mutation and turns expected failures into an `ActionResult`.
 * Anything else, including `redirect()` on an expired session, is rethrown.
 */
export async function runAction(task: () => Promise<string>): Promise<ActionResult> {
  try {
    const message = await task();
    refreshAdmin();
    return { ok: true, message };
  } catch (error) {
    if (error instanceof InputError) return { ok: false, error: error.message };

    if (error instanceof ApiError) {
      // 409 usually means another admin changed the record first: show fresh data.
      if (error.status === 409) refreshAdmin();
      return { ok: false, error: error.message };
    }

    throw error;
  }
}

export function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** `NaN` when the field is empty or not a number. */
export function readNumber(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value === "" ? Number.NaN : Number(value);
}

/** The uploaded image, or `null` when no file was chosen. */
export function readImage(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) return null;

  const error = validateImage(value);
  if (error) throw new InputError(error);

  return value;
}

export function assertId(id: unknown) {
  if (!isObjectId(id)) throw new InputError("This record no longer exists. Refresh the page.");
  return id;
}

/**
 * Multipart body for create/update requests that include an image.
 * Arrays and objects are sent as JSON strings, which the API accepts.
 */
export function toFormData(fields: object, files: Record<string, File>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }

  for (const [key, file] of Object.entries(files)) formData.append(key, file);

  return formData;
}

/** Multipart when a new image is attached, plain JSON otherwise. */
export function requestBody(fields: object, files: Record<string, File | null>) {
  const attached = Object.fromEntries(
    Object.entries(files).filter((entry): entry is [string, File] => entry[1] !== null),
  );

  return Object.keys(attached).length > 0 ? toFormData(fields, attached) : fields;
}
