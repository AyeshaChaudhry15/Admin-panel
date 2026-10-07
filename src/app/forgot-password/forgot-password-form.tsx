"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { requestPasswordReset } from "@/lib/actions/auth";

export function ForgotPasswordForm({
  defaultEmail,
}: {
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    email: defaultEmail,
  });

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Admin email" htmlFor="email">
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

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Button type="submit" pending={pending} className="w-full">
        {!pending && <Send />}
        {pending ? "Sending code…" : "Send reset code"}
      </Button>
    </form>
  );
}
