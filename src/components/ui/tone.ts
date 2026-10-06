import type { Tone } from "@/lib/constants";

/** Tinted icon tile per tone. Kept as literal strings so Tailwind can see them. */
export const toneTile: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand",
  info: "bg-info/10 text-info",
  violet: "bg-violet/10 text-violet",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-white/5 text-muted",
};

export const toneBadge: Record<Tone, string> = {
  brand: "border-brand/25 bg-brand/10 text-brand",
  info: "border-info/25 bg-info/10 text-info",
  violet: "border-violet/25 bg-violet/10 text-violet",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  neutral: "border-line-strong bg-white/5 text-muted",
};

export const toneText: Record<Tone, string> = {
  brand: "text-brand",
  info: "text-info",
  violet: "text-violet",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted",
};

export const toneDot: Record<Tone, string> = {
  brand: "bg-brand",
  info: "bg-info",
  violet: "bg-violet",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted",
};
