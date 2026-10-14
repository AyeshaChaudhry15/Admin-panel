import type { Metadata } from "next";
import {
  CalendarDays,
  Clock,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ChangePasswordButton } from "@/app/admin/profile/change-password";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/server/session";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const admin = await requireAdmin();

  const details = [
    { label: "Full name", value: admin.fullName },
    { label: "Email address", value: admin.email },
    { label: "Member since", value: formatDate(admin.createdAt) },
    { label: "Account ID", value: admin._id, mono: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRound}
        eyebrow="Account"
        title="Admin Profile"
        description="Your account details and security settings."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel className="p-6 sm:p-7">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-24 items-center justify-center rounded-full border-2 border-[#0057D9]/40 bg-linear-135 from-[#0057D9]/20 to-[#FF8A00]/10 text-3xl font-bold text-[#FF8A00]">
              {initials(admin.fullName)}
            </div>

            <h2 className="mt-4 text-lg font-semibold text-white">
              {admin.fullName}
            </h2>

            <p className="mt-1 text-sm text-muted">Administrator</p>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#0057D9]/10 px-2.5 py-1 text-xs font-semibold text-[#0057D9]">
              <ShieldCheck className="size-3.5" />
              Verified Admin
            </span>
          </div>

          <div className="my-6 h-px bg-line" />

          <dl className="space-y-4">
            <InfoRow icon={Mail} label="Email" value={admin.email} />
            <InfoRow
              icon={CalendarDays}
              label="Member since"
              value={formatDate(admin.createdAt)}
            />
            <InfoRow
              icon={Clock}
              label="Last updated"
              value={formatDateTime(admin.updatedAt)}
            />
          </dl>
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel>
            <PanelHeader
              title="Account details"
              description="Name and email are managed on the server. Ask your developer to change them."
            />

            <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              {details.map((item) => (
                <div key={item.label} className="min-w-0">
                  <dt className="text-xs font-medium text-muted">
                    {item.label}
                  </dt>

                  <dd
                    className={
                      item.mono
                        ? "mt-1.5 truncate rounded-xl border border-[#0057D9]/20 bg-field px-4 py-2.5 font-mono text-xs text-ink-soft"
                        : "mt-1.5 truncate rounded-xl border border-[#0057D9]/20 bg-field px-4 py-2.5 text-sm text-white"
                    }
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF8A00]/10 text-[#FF8A00]">
              <Lock className="size-5" />
            </span>

            <div className="flex-1">
              <h3 className="font-semibold text-white">
                Password & security
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-muted">
                Use a strong password and change it regularly. Changing it
                signs out every other device; sessions last one hour.
              </p>
            </div>

            <ChangePasswordButton />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0057D9]/10 text-[#0057D9]">
        <Icon className="size-4" />
      </span>

      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 truncate text-sm text-ink-soft">{value}</dd>
      </div>
    </div>
  );
}