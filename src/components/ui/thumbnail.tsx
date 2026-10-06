import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-9 rounded-lg", px: 36 },
  md: { box: "size-12 rounded-xl", px: 48 },
  lg: { box: "size-16 rounded-xl", px: 64 },
};

interface ThumbnailProps {
  src: string | null | undefined;
  alt: string;
  fallback: LucideIcon;
  size?: keyof typeof sizes;
}

/** Small, optimized product/brand image with an icon fallback. */
export function Thumbnail({ src, alt, fallback: Fallback, size = "md" }: ThumbnailProps) {
  const { box, px } = sizes[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-line-strong bg-field",
        box,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${px}px`} className="object-contain p-1" />
      ) : (
        <Fallback className="size-5 text-subtle" aria-hidden />
      )}
    </div>
  );
}
