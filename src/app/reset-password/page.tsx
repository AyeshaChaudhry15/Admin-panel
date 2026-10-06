import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { AuthShell } from "@/components/auth-shell";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const email = firstParam((await searchParams).email)?.trim() || undefined;

  return (
    <AuthShell
      title="Check your email"
      description={
        email ? (
          <>
            If an admin account exists for <b className="text-ink-soft">{email}</b>, we&apos;ve
            sent it a 6-digit code. Check your spam folder if it doesn&apos;t arrive within a
            minute.
          </>
        ) : (
          "Enter the 6-digit code from the email and choose a new password."
        )
      }
      footer={
        <Link href="/login" className="font-medium text-info transition-colors hover:text-white">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm email={email} />
    </AuthShell>
  );
}
