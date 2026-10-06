"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <SubmitButton
        className={cn(
          "flex w-full items-center gap-3 transition-colors disabled:opacity-60",
          className,
        )}
      />
    </form>
  );
}
