import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const fieldStyles =
  "w-full rounded-xl border border-line-strong bg-field px-4 text-sm text-white outline-none transition-colors placeholder:text-subtle hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-baseline gap-2 text-sm font-medium text-ink-soft"
      >
        {label}

        {optional && (
          <span className="text-xs font-normal text-subtle">
            Optional
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        fieldStyles,
        "h-11",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        fieldStyles,
        "min-h-28 resize-y py-3 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          fieldStyles,
          "h-11 appearance-none pr-10 [&>option]:bg-field",
          className,
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        {description && (
          <p className="mt-0.5 text-xs text-subtle">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

const alertTones = {
  danger: {
    icon: CircleAlert,
    className:
      "border-danger/30 bg-danger/10 text-danger",
  },

  success: {
    icon: CircleCheck,
    className:
      "border-brand/30 bg-brand/10 text-brand",
  },

  info: {
    icon: Info,
    className:
      "border-info/30 bg-info/10 text-info",
  },
};

export function FormAlert({
  tone = "danger",
  children,
}: {
  tone?: keyof typeof alertTones;
  children: React.ReactNode;
}) {
  const {
    icon: Icon,
    className,
  } = alertTones[tone];

  return (
    <div
      role={
        tone === "danger"
          ? "alert"
          : "status"
      }
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />

      <div>{children}</div>
    </div>
  );
}