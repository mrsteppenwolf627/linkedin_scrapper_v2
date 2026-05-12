import Link from "next/link";

export default function CTASection() {
  return (
    <section
      className="bg-[#D94F00] border-t-2 border-[#1A1A1A] py-24"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-4xl mx-auto px-6 text-center space-y-10">

        {/* System tag */}
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0EDE4] opacity-70">
          Acceso bajo aprobación admin
        </p>

        {/* Heading */}
        <h2
          id="cta-heading"
          className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-[#F0EDE4] leading-tight"
        >
          ¿Listo para aumentar<br />
          tu prospección?
        </h2>

        <p className="text-sm font-bold uppercase tracking-wider text-[#F0EDE4] opacity-80 max-w-md mx-auto">
          Solicita acceso, el equipo lo revisará en menos de 24h.
          Gratis durante el beta.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login?tab=signup"
            className="bg-[#F0EDE4] text-[#1A1A1A] text-sm font-black uppercase tracking-widest px-10 py-4 border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F0EDE4] transition-colors shadow-[5px_5px_0px_#1A1A1A] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
            aria-label="Registrarse gratis"
          >
            Registrarse gratis
          </Link>
          <Link
            href="#docs"
            className="bg-transparent text-[#F0EDE4] text-sm font-black uppercase tracking-widest px-10 py-4 border-2 border-[#F0EDE4] hover:bg-[#F0EDE4] hover:text-[#1A1A1A] transition-colors"
            aria-label="Ver documentación"
          >
            Ver demo →
          </Link>
        </div>

      </div>
    </section>
  );
}
