"use client";

import type { ImageLoaderProps } from "next/image";

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;

/**
 * Product images and logos live on Cloudinary, which can resize and convert
 * them on its CDN. Asking it directly is faster than proxying the (often
 * multi-megabyte) originals through Next's optimizer.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  const match = src.match(CLOUDINARY);

  if (match) {
    const [, cloud, path] = match;
    return `https://res.cloudinary.com/${cloud}/image/upload/c_limit,w_${width},q_${quality ?? "auto"},f_auto/${path}`;
  }

  // Local files in /public are small and served as-is.
  return `${src}?w=${width}`;
}
