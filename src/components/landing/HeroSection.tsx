import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="min-h-screen bg-[#F0EDE4] flex items-center pt-14"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-7xl mx-auto px-6 w-full py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Copy */}
          <div className="space-y-8">
            {/* Status chip */}
            <div className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] px-3 py-1.5 bg-white">
              <span className="w-2 h-2 bg-[#4A7C59] animate-pulse inline-block" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Sistema activo — GPT-4o-mini
              </span>
            </div>

            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#1A1A1A]"
              >
                Automatiza<br />
                tu prospección<br />
                <span className="text-[#D94F00]">en LinkedIn</span>
              </h1>

              <p className="text-sm font-bold uppercase tracking-wider text-[#6B6B5E] max-w-md leading-relaxed">
                Busca contactos relevantes, genera mensajes personalizados con IA
                y gestiona tus campañas de outreach desde un solo sistema.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login?tab=signup"
                className="bg-[#1A1A1A] text-[#F0EDE4] text-sm font-black uppercase tracking-widest px-8 py-4 border-2 border-[#1A1A1A] hover:bg-[#D94F00] hover:border-[#D94F00] transition-colors shadow-[5px_5px_0px_#1A1A1A] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                aria-label="Empezar ahora — crear cuenta"
              >
                Empezar ahora
              </Link>
              <Link
                href="#features"
                className="bg-transparent text-[#1A1A1A] text-sm font-black uppercase tracking-widest px-8 py-4 border-2 border-[#1A1A1A] hover:bg-[#E8E4DB] transition-colors"
                aria-label="Ver características del sistema"
              >
                Ver features ↓
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-4 border-t-2 border-[#1A1A1A]">
              {[
                { value: "3×", label: "más rápido" },
                { value: "IA", label: "personalización" },
                { value: "100%", label: "tuyo" },
              ].map(({ value, label }) => (
                <div key={label} className="space-y-0.5">
                  <div className="text-2xl font-black text-[#D94F00] uppercase">{value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal preview card */}
          <div
            className="border-2 border-[#1A1A1A] bg-[#1A1A1A] shadow-[10px_10px_0px_#D94F00] hidden lg:block"
            aria-hidden="true"
          >
            {/* Terminal bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <span className="w-3 h-3 border border-white/20 bg-[#D94F00]" />
              <span className="w-3 h-3 border border-white/20 bg-[#4A7C59]" />
              <span className="w-3 h-3 border border-white/20 bg-white/20" />
              <span className="ml-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                WABI-SABI.SYS — SCAN_TERMINAL
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-6 font-mono text-xs leading-loose text-[#F0EDE4]">
              <p className="text-[#4A7C59]">{'>'} INITIALIZE_SCAN</p>
              <p className="opacity-50">  CARGO_OBJETIVO: "Senior DevOps"</p>
              <p className="opacity-50">  SECTOR: "Fintech"</p>
              <p className="opacity-50">  LOCATION: "Madrid"</p>
              <p className="text-[#D94F00] mt-2">{'>'} SCANNING... ████████░░ 80%</p>
              <p className="opacity-50 mt-1">  [OK] Lead encontrado: J. García — CTO @ Fintech.io</p>
              <p className="opacity-50">  [OK] Lead encontrado: M. López — VP Eng @ Bankia</p>
              <p className="opacity-50">  [OK] Lead encontrado: A. Martínez — SRE @ Revolut</p>
              <p className="text-[#4A7C59] mt-2">{'>'} GENERANDO_MENSAJES...</p>
              <p className="opacity-50">  [HOOK] "Vi que Fintech.io acaba de levantar serie B..."</p>
              <p className="opacity-50">  [SOCIAL] "Trabajamos con 3 equipos similares en..."</p>
              <p className="text-[#D94F00] mt-2">{'>'} STATUS: COMPLETE — 47 LEADS FOUND_</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
