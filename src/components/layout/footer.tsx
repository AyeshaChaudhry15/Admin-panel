export function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-2 border-t border-line px-4 py-5 text-center text-xs text-muted sm:flex-row sm:px-6 sm:text-left lg:px-8">
      <span>
        © {new Date().getFullYear()} <b className="text-brand">EVINN.</b> All
        Rights Reserved.
      </span>
      <span className="inline-flex items-center gap-2">
        Pakistan&apos;s Trusted Electric Mobility Marketplace
        <i
          aria-hidden
          className="inline-block h-0.75 w-8 rounded-full bg-brand"
        />
      </span>
    </footer>
  );
}
