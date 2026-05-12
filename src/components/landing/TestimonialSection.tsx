export default function TestimonialSection() {
  return (
    <section
      className="bg-[#1A1A1A] border-t-2 border-[#1A1A1A] py-24"
      aria-label="Testimonio"
    >
      <div className="max-w-4xl mx-auto px-6 text-center space-y-10">

        {/* Decorative accent */}
        <div
          className="w-12 h-[3px] bg-[#D94F00] mx-auto"
          aria-hidden="true"
        />

        {/* Quote */}
        <blockquote className="space-y-6">
          <p className="text-2xl md:text-4xl font-black italic tracking-tighter text-[#F0EDE4] leading-tight uppercase">
            &ldquo;Esta herramienta ha transformado nuestra forma de hacer outreach.
            Pasamos de 2 horas por campaña a 10 minutos.&rdquo;
          </p>

          <footer className="space-y-1">
            <cite className="not-italic text-[10px] font-black uppercase tracking-[0.3em] text-[#D94F00]">
              — Sales Team
            </cite>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              B2B Software Company · Madrid
            </p>
          </footer>
        </blockquote>

        {/* Social proof chips */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {[
            "47 leads / scan",
            "3× más rápido",
            "IA humanization",
            "Batch export",
          ].map((chip) => (
            <span
              key={chip}
              className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-3 py-1.5 text-white/50"
            >
              {chip}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
