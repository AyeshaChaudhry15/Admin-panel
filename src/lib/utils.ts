import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/constants";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

export function validateImage(file: File): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Only JPEG, PNG, WebP, GIF and AVIF images are allowed.";
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return null;
  }
  return value;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0][0], parts.at(-1)![0]] : [parts[0]?.[0] ?? "A"];
  return letters.join("").toUpperCase();
}

export function whatsAppUrl(phone: string) {
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}
