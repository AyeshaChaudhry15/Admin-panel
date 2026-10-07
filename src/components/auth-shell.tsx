import Image from "next/image";
import { Reveal } from "@/components/reveal";

interface AuthShellProps {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(102,220,23,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(78,161,245,0.08),transparent_50%)]"
      />
      <Image
        src="/evee1.png"
        alt=""
        width={401}
        height={420}
        className="pointer-events-none absolute -right-24 -bottom-16 -z-10 hidden -scale-x-100 opacity-[0.07] lg:block"
      />

      <div className="w-full max-w-md">
        <Reveal className="mb-8 text-center">
          <p className="text-4xl leading-none font-extrabold tracking-[-0.06em] text-white">
            E<span className="text-brand">V</span>INN
          </p>
          <p className="mt-2 text-sm text-muted">Admin Panel</p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-line bg-surface/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <div className="mt-1.5 text-sm leading-relaxed text-muted">{description}</div>
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </Reveal>

        <p className="mt-10 text-center text-xs text-subtle">
          © {new Date().getFullYear()} EVINN · Drive{" "}
          <span className="text-brand">Greener Tomorrow</span>
        </p>
      </div>
    </main>
  );
}
