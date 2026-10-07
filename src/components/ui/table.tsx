import { cn } from "@/lib/utils";

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line bg-field/70">{children}</tr>
    </thead>
  );
}

export function TH({
  align = "left",
  className,
  children,
}: {
  align?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-3.5 text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-muted uppercase first:pl-6 last:pr-6",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TR({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-line/70 transition-colors last:border-0 hover:bg-surface-raised">
      {children}
    </tr>
  );
}

export function TD({
  align = "left",
  className,
  children,
}: {
  align?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <td
      className={cn(
        "px-5 py-4 align-middle text-sm text-ink-soft first:pl-6 last:pr-6",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
