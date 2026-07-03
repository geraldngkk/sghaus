import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

interface HeaderProps {
  /** Currently active nav item for underline styling */
  activeNav?: "buy" | "sell" | "about" | "contact";
}

export default function Header({ activeNav }: HeaderProps) {
  const navItems = [
    { key: "buy", label: "Buy", href: "/buy" },
    { key: "sell", label: "Sell", href: "/sell" },
    { key: "about", label: "About", href: "/about" },
    { key: "contact", label: "Contact", href: "/contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-[200] border-b border-border bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-10">
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Wordmark className="h-7 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                activeNav === item.key
                  ? "text-forest border-b-2 border-forest pb-0.5"
                  : "text-slate hover:text-charcoal"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="flex items-center gap-5 sm:hidden">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-xs font-medium transition-colors ${
                activeNav === item.key
                  ? "text-forest"
                  : "text-slate hover:text-charcoal"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
