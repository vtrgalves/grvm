import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const phases = [
  {
    phase: "Fase 1",
    title: "Lançamento",
    desc: "Lançamento do token e comunidade inicial",
    detail: "O início do ecossistema Groovium.\nAqui, a economia da música ganha vida: músicos e fãs começam a interagir, gerar valor e receber créditos através da participação ativa. Cada conexão vira recompensa.",
    glowClass: "hover:box-glow-blue border-primary/20",
    activeClass: "box-glow-blue border-primary/40",
    dotColor: "bg-primary",
  },
  {
    phase: "Fase 2",
    title: "Plataforma",
    desc: "Desenvolvimento da plataforma musical",
    detail: "Mais informações em breve.",
    glowClass: "hover:box-glow-purple border-secondary/20",
    activeClass: "box-glow-purple border-secondary/40",
    dotColor: "bg-secondary",
  },
  {
    phase: "Fase 3",
    title: "NFTs",
    desc: "Integração com NFTs e marketplace",
    detail: "Mais informações em breve.",
    glowClass: "hover:box-glow-magenta border-accent/20",
    activeClass: "box-glow-magenta border-accent/40",
    dotColor: "bg-accent",
  },
  {
    phase: "Fase 4",
    title: "Expansão",
    desc: "Expansão global e parcerias estratégicas",
    detail: "Mais informações em breve.",
    glowClass: "hover:box-glow-blue border-primary/20",
    activeClass: "box-glow-blue border-primary/40",
    dotColor: "bg-primary",
  },
];

const RoadmapSection = () => {
  const ref = useScrollReveal();
  const [activePhase, setActivePhase] = useState<number | null>(null);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
          Nossa <span className="gradient-neon-text text-glow-blue">jornada</span>
        </h2>

        <div className="max-w-5xl mx-auto relative flex flex-col md:flex-row gap-8">
          {/* Timeline */}
          <div className="flex-1 relative">
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/30 via-secondary/30 to-accent/30" />

            <div className="space-y-12">
              {phases.map(({ phase, title, desc, glowClass, activeClass, dotColor, detail }, i) => (
                <div key={i} className="relative flex items-start gap-6">
                  <div className="absolute left-4 md:left-8 -translate-x-1/2 top-2">
                    <div className={`w-4 h-4 rounded-full ${dotColor} shadow-[0_0_12px_currentColor]`} />
                  </div>

                  <div className="ml-12 md:ml-16 flex-1">
                    <div
                      onClick={() => detail && setActivePhase(activePhase === i ? null : i)}
                      className={`p-6 rounded-xl glass-card transition-all duration-300 ${
                        activePhase === i ? activeClass : glowClass
                      } ${detail ? "cursor-pointer hover:scale-105" : "hover:scale-105"}`}
                    >
                      <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                        {phase}
                      </span>
                      <h3 className="font-display text-xl font-bold mt-1 mb-2">{title}</h3>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div
            className={`md:w-[340px] transition-all duration-500 ${
              activePhase !== null && phases[activePhase].detail
                ? "opacity-100 translate-x-0"
                : "opacity-0 md:translate-x-4 pointer-events-none"
            }`}
          >
            {activePhase !== null && phases[activePhase].detail && (
              <div className="glass-card border-primary/20 box-glow-blue rounded-xl p-6 sticky top-24">
                <span className="font-display text-xs uppercase tracking-widest text-primary">
                  {phases[activePhase].phase}
                </span>
                <h3 className="font-display text-lg font-bold mt-2 mb-3">
                  {phases[activePhase].title}
                </h3>
                {phases[activePhase].detail!.split("\n").map((line, idx) => (
                  <p key={idx} className="text-muted-foreground text-sm leading-relaxed mb-2">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
