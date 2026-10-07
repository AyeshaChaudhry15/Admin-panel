"use client";

import type { ImageLoaderProps } from "next/image";

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  const match = src.match(CLOUDINARY);

  if (match) {
    const [, cloud, path] = match;
    return `https://res.cloudinary.com/${cloud}/image/upload/c_limit,w_${width},q_${quality ?? "auto"},f_auto/${path}`;
  }

  return `${src}?w=${width}`;
}
