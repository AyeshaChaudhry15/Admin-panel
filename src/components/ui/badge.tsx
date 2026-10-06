import { toneBadge, toneDot } from "@/components/ui/tone";
import type { Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "neutral", dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5",
        toneBadge[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", toneDot[tone])} />}
      {children}
    </span>
  );
}
