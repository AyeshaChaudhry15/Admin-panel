"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { resendResetCode, resetPassword } from "@/lib/actions/auth";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/constants";

const RESEND_COOLDOWN = 60;

export function ResetPasswordForm({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, { email });
  const [cooldown, setCooldown] = useState(email ? RESEND_COOLDOWN : 0);
  const [resending, startResend] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function resend() {
    if (!email) return;
    setNotice(null);
    startResend(async () => {
      const result = await resendResetCode(email);
      if (result.ok) {
        setNotice({ ok: true, text: result.message });
        setCooldown(RESEND_COOLDOWN);
      } else {
        setNotice({ ok: false, text: result.error });
      }
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="email" value={email ?? ""} />

      <Field
        label="6-digit code"
        htmlFor="otp"
        hint="The code expires 10 minutes after it was sent."
      >
        <Input
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          title="The 6-digit code from the email"
          placeholder="••••••"
          defaultValue={state.otp}
          required
          className="text-center font-mono text-lg tracking-[0.6em]"
        />
      </Field>

      <Field
        label="New password"
        htmlFor="new-password"
        hint={`${PASSWORD_MIN}–${PASSWORD_MAX} characters.`}
      >
        <PasswordInput
          id="new-password"
          name="newPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          required
        />
      </Field>

      <Field label="Confirm new password" htmlFor="confirm-password">
        <PasswordInput
          id="confirm-password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          required
        />
      </Field>

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {notice && (
        <FormAlert tone={notice.ok ? "success" : "danger"}>
          {notice.text}
        </FormAlert>
      )}

      <Button type="submit" pending={pending} className="w-full">
        {!pending && <KeyRound />}
        {pending ? "Resetting…" : "Reset password"}
      </Button>

      <p className="text-center text-sm text-muted">
        Didn&apos;t get a code?{" "}
        {email ? (
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || resending}
            className="font-medium text-info transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-subtle"
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
        ) : (
          <Link
            href="/forgot-password"
            className="font-medium text-info hover:text-white"
          >
            Request a code
          </Link>
        )}
      </p>
    </form>
  );
}
