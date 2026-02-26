import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto bg-forest">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="font-display text-lg tracking-tight">
              <span className="text-white">SG</span>
              <span className="text-white/60">haus</span>
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/buy" className="transition-colors hover:text-white">
              Buy
            </Link>
            <Link href="/sell" className="transition-colors hover:text-white">
              Sell
            </Link>
            <Link href="/about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </div>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} SGHaus
          </p>
        </div>
      </div>
    </footer>
  );
}
