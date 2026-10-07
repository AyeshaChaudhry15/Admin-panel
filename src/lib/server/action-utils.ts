import "server-only";

import { revalidatePath } from "next/cache";
import { DASHBOARD_PATH } from "@/lib/constants";
import { ApiError } from "@/lib/server/http";
import { isObjectId, validateImage } from "@/lib/utils";
import type { ActionResult } from "@/types/actions";

export class InputError extends Error {}

export function refreshAdmin() {
  revalidatePath(DASHBOARD_PATH, "layout");
}

export async function runAction(
  task: () => Promise<string>,
): Promise<ActionResult> {
  try {
    const message = await task();
    refreshAdmin();
    return { ok: true, message };
  } catch (error) {
    if (error instanceof InputError) return { ok: false, error: error.message };

    if (error instanceof ApiError) {
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

export function readNumber(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value === "" ? Number.NaN : Number(value);
}

export function readImage(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) return null;

  const error = validateImage(value);
  if (error) throw new InputError(error);

  return value;
}

export function assertId(id: unknown) {
  if (!isObjectId(id))
    throw new InputError("This record no longer exists. Refresh the page.");
  return id;
}

export function toFormData(fields: object, files: Record<string, File>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    formData.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  }

  for (const [key, file] of Object.entries(files)) formData.append(key, file);

  return formData;
}

export function requestBody(
  fields: object,
  files: Record<string, File | null>,
) {
  const attached = Object.fromEntries(
    Object.entries(files).filter(
      (entry): entry is [string, File] => entry[1] !== null,
    ),
  );

  return Object.keys(attached).length > 0
    ? toFormData(fields, attached)
    : fields;
}
