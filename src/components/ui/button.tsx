import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-soft";

type Size = "sm" | "md" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink shadow-[0_8px_30px_rgba(255,138,0,0.15)] hover:bg-brand-strong",

  secondary:
    "border border-line-strong bg-surface-raised text-ink-soft hover:border-brand/50 hover:text-white",

  ghost:
    "text-muted hover:bg-brand/10 hover:text-brand",

  danger:
    "bg-danger text-white hover:bg-danger/85",

  "danger-soft":
    "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-lg px-3 text-xs",
  md: "h-11 rounded-xl px-5 text-sm",
  icon: "size-9 rounded-lg",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    base,
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps
  extends React.ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
}

export function Button({
  variant,
  size,
  pending = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonStyles({
        variant,
        size,
        className,
      })}
      {...props}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}