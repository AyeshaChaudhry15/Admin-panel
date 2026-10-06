import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";
import { AuthShell } from "@/components/auth-shell";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const email = firstParam((await searchParams).email);

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your admin email and we'll send you a 6-digit code to reset it."
      footer={
        <Link href="/login" className="font-medium text-info transition-colors hover:text-white">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm defaultEmail={email} />
    </AuthShell>
  );
}
