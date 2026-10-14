import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth-shell";
import { FormAlert } from "@/components/ui/form";
import { DASHBOARD_PATH } from "@/lib/constants";
import { getCurrentAdmin } from "@/lib/server/session";
import { firstParam } from "@/lib/search-params";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectPath(firstParam(params.next)) ?? undefined;

  if (await getCurrentAdmin()) redirect(next ?? DASHBOARD_PATH);

  const passwordReset = firstParam(params.reset) === "1";
  const sessionExpired = firstParam(params.session) === "expired";

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage the EVINN catalog, orders and customer requests."
    >
      {(passwordReset || sessionExpired) && (
        <div className="mb-5">
          {passwordReset ? (
            <FormAlert tone="success">
              Your password has been reset. Sign in with your new password.
            </FormAlert>
          ) : (
            <FormAlert tone="info">
              Your session has expired. Please sign in again.
            </FormAlert>
          )}
        </div>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}