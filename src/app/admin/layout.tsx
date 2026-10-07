import { Footer } from "@/components/layout/footer";
import { PanelShell } from "@/components/layout/panel-shell";
import { getPendingCounts } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  const countsPromise = getPendingCounts();

  return (
    <PanelShell
      admin={admin}
      countsPromise={countsPromise}
      siteUrl={process.env.SITE_URL}
      footer={<Footer />}
    >
      {children}
    </PanelShell>
  );
}
