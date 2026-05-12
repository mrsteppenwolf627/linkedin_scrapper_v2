import Link from "next/link";

const year = 2026;

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] border-t-2 border-[#1A1A1A]" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter text-[#F0EDE4]"
          aria-label="LinkedIn Scraper — volver al inicio"
        >
          <span className="text-[#D94F00]">⚡</span>
          <span>LinkedIn Scraper</span>
        </Link>

        {/* Links */}
        <nav className="flex flex-wrap gap-6" aria-label="Footer navigation">
          {[
            { label: "Términos", href: "/terms" },
            { label: "Privacidad", href: "/privacy" },
            { label: "Contacto", href: "/contact" },
            { label: "Docs", href: "/docs" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          © {year} LinkedIn Scraper
        </p>

      </div>
    </footer>
  );
}
