"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { login } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@evinn.com"
          defaultValue={state.email}
          required
        />
      </Field>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label
            htmlFor="password"
            className="text-sm font-medium text-ink-soft"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-info transition-colors hover:text-white"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
        />
      </div>

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Button type="submit" pending={pending} className="w-full">
        {!pending && <LogIn />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
