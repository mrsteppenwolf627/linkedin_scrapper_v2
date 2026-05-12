import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F0EDE4] border-b-2 border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-sm tracking-tighter text-[#1A1A1A] uppercase"
        >
          <span className="text-[#D94F00]">⚡</span>
          <span>LinkedIn Scraper</span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
          <Link
            href="#features"
            className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] opacity-60 hover:opacity-100 transition-opacity"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] opacity-60 hover:opacity-100 transition-opacity"
          >
            Pricing
          </Link>
          <Link
            href="#docs"
            className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] opacity-60 hover:opacity-100 transition-opacity"
          >
            Docs
          </Link>
        </nav>

        {/* CTA */}
        <Link
          href="/login"
          className="bg-[#1A1A1A] text-[#F0EDE4] text-[11px] font-black uppercase tracking-widest px-5 py-2.5 border-2 border-[#1A1A1A] hover:bg-[#D94F00] hover:border-[#D94F00] transition-colors shadow-[3px_3px_0px_#1A1A1A]"
          aria-label="Empezar — acceder al sistema"
        >
          Empezar →
        </Link>
      </div>
    </header>
  );
}
