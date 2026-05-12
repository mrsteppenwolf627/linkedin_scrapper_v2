const features = [
  {
    icon: "⚡",
    label: "Búsqueda inteligente",
    heading: "Encuentra contactos\nrelevantes",
    body: "Combina búsqueda en Google con validación IA para encontrar exactamente los perfiles que necesitas, filtrados por cargo, sector y ubicación.",
    tag: "AI_VALIDATED",
    tagColor: "#4A7C59",
  },
  {
    icon: "✉",
    label: "Generador de mensajes",
    heading: "Mensajes que\nparecen humanos",
    body: "GPT-4o-mini genera 3 variantes por lead con trigger real y voz del prospect. Detección IA integrada — si el score es alto, se humaniza automáticamente.",
    tag: "GPT-4O-MINI",
    tagColor: "#D94F00",
  },
  {
    icon: "◈",
    label: "Gestión de campañas",
    heading: "Organiza tus\ncampañas en lotes",
    body: "Crea, selecciona y borra lotes de mensajes. Compara generaciones anteriores. Exporta CSV, HTML o PDF en un clic.",
    tag: "BATCH_V2",
    tagColor: "#1A1A1A",
  },
] as const;

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-[#E8E4DB] border-t-2 border-[#1A1A1A] py-24"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="mb-16 border-b-4 border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D94F00] mb-2">
              Módulos del sistema
            </p>
            <h2
              id="features-heading"
              className="text-4xl font-black italic tracking-tighter uppercase text-[#1A1A1A]"
            >
              Todo lo que necesitas
            </h2>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B6B5E] max-w-xs">
            Un pipeline completo: busca, genera, humaniza y gestiona.
          </p>
        </div>

        {/* 3-column feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon, label, heading, body, tag, tagColor }) => (
            <article
              key={label}
              className="border-2 border-[#1A1A1A] bg-white p-8 shadow-[6px_6px_0px_#1A1A1A] flex flex-col gap-6"
              aria-label={label}
            >
              {/* Icon + tag row */}
              <div className="flex items-start justify-between">
                <span className="text-3xl" aria-hidden="true">{icon}</span>
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-1 border-2"
                  style={{ borderColor: tagColor, color: tagColor }}
                >
                  {tag}
                </span>
              </div>

              {/* Label */}
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B6B5E]">
                {label}
              </p>

              {/* Heading */}
              <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-tight text-[#1A1A1A] whitespace-pre-line">
                {heading}
              </h3>

              {/* Divider */}
              <div className="h-[2px] w-10" style={{ backgroundColor: tagColor }} aria-hidden="true" />

              {/* Body */}
              <p className="text-xs font-bold text-[#6B6B5E] leading-relaxed">
                {body}
              </p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
