import { Activity, Cpu, ShieldCheck, Sparkles, ArrowDown } from "lucide-react";

const STEPS = [
  {
    icon: Activity,
    title: "Web2 Activity",
    desc: "Você curte, segue, completa missões, coleciona NFTs, envia tips.",
    color: "text-accent",
    border: "border-accent/40",
    bg: "from-accent/10 to-transparent",
  },
  {
    icon: Cpu,
    title: "Chainlink CRE Workflow",
    desc: "O Oracle orquestra IA, APIs externas e sua atividade em um workflow descentralizado.",
    color: "text-primary",
    border: "border-primary/40",
    bg: "from-primary/10 to-transparent",
  },
  {
    icon: ShieldCheck,
    title: "Solana Oracle Proof",
    desc: "Uma prova SHA-256 é registrada como memo na Solana Devnet — imutável e verificável.",
    color: "text-secondary",
    border: "border-secondary/40",
    bg: "from-secondary/10 to-transparent",
  },
  {
    icon: Sparkles,
    title: "GRVM Reputation",
    desc: "Seu Reputation Score evolui (0–1000) e desbloqueia 7 ranks: Rookie → Genesis Icon.",
    color: "text-primary",
    border: "border-primary/40",
    bg: "from-primary/15 via-accent/10 to-secondary/15",
  },
];

export default function OracleReputationSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/5 text-[10px] font-display uppercase tracking-[0.2em] text-primary mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Proof of Support Oracle
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-black gradient-neon-text mb-4">
            Sua reputação musical agora é verificável.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            O Groovium transforma sua atividade no ecossistema em <strong className="text-foreground">reputação Web3 gamificada</strong>,
            validada por Chainlink CRE e registrada na Solana Devnet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-3 max-w-6xl mx-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative">
                <div className={`h-full rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} bg-background/40 backdrop-blur p-5 hover:scale-[1.02] transition-transform`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.border} bg-background/60 mb-4 ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">
                    Etapa 0{i + 1}
                  </div>
                  <h3 className={`font-display text-lg font-bold mb-2 ${s.color}`}>{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background border border-primary/40 items-center justify-center">
                    <ArrowDown className="w-3 h-3 text-primary -rotate-90" />
                  </div>
                )}
                {i < STEPS.length - 1 && (
                  <div className="flex md:hidden justify-center my-2">
                    <ArrowDown className="w-4 h-4 text-primary/60" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-background/40 backdrop-blur text-xs text-muted-foreground">
            <span className="text-primary font-display uppercase tracking-wider">Web2 Activity</span>
            <ArrowDown className="w-3 h-3 -rotate-90 text-muted-foreground/60" />
            <span className="text-primary font-display uppercase tracking-wider">Chainlink CRE</span>
            <ArrowDown className="w-3 h-3 -rotate-90 text-muted-foreground/60" />
            <span className="text-secondary font-display uppercase tracking-wider">Solana Proof</span>
            <ArrowDown className="w-3 h-3 -rotate-90 text-muted-foreground/60" />
            <span className="text-accent font-display uppercase tracking-wider">GRVM Reputation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
