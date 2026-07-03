import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function Footer() {
  return (
    <footer className="hero-drench relative mt-auto overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1200px] px-5 py-12 sm:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <Wordmark className="h-6 w-auto" color="#F4EFE6" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-mist/70">
              Three decisive numbers for the biggest decision of your life. Built
              on real resale transactions, not guesswork.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-mist/70">
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
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-mist/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SGHaus.</p>
          <p>Always do your own due diligence before you offer.</p>
        </div>
      </div>
    </footer>
  );
}
