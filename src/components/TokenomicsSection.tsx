import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  { label: "Comunidade", pct: 50, desc: "O coração do projeto", color: "from-primary to-neon-blue" },
  { label: "Liquidez", pct: 30, desc: "Estabilidade e crescimento", color: "from-secondary to-neon-purple" },
  { label: "Desenvolvimento", pct: 20, desc: "Evolução contínua", color: "from-accent to-neon-magenta" },
];

const TokenomicsSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
          <span className="gradient-neon-text text-glow-blue">Tokenomics</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Uma distribuição pensada para crescimento sustentável e fortalecimento da comunidade.
        </p>

        <div className="max-w-3xl mx-auto space-y-8">
          {items.map(({ label, pct, desc, color }, i) => (
            <div key={i} className="group">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-display font-bold text-lg">{label}</span>
                  <span className="text-muted-foreground text-sm ml-3">— {desc}</span>
                </div>
                <span className="font-display font-bold text-xl gradient-neon-text">{pct}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 group-hover:shadow-lg`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Visual ring */}
        <div className="mt-16 flex justify-center">
          <div className="relative w-48 h-48 md:w-64 md:h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(191 100% 50%)" strokeWidth="8" strokeDasharray="125.66 125.66" strokeDashoffset="0" className="drop-shadow-lg" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(270 80% 55%)" strokeWidth="8" strokeDasharray="75.4 176" strokeDashoffset="-125.66" className="drop-shadow-lg" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(330 100% 55%)" strokeWidth="8" strokeDasharray="50.26 200" strokeDashoffset="-201.06" className="drop-shadow-lg" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-bold text-lg gradient-neon-text animate-neon-flicker">GRVM</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
