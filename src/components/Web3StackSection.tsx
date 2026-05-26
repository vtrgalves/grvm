import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ChainlinkLogo } from "@/components/web3/ChainlinkLogo";
import { SolanaLogo } from "@/components/web3/SolanaLogo";
import { Sparkles } from "lucide-react";

const cards = [
  {
    title: "Chainlink CRE",
    desc: "Orquestração de reputação, IA e dados externos para o Proof of Support Oracle.",
    icon: <ChainlinkLogo className="w-6 h-6" />,
    accent: "border-primary/30 hover:border-primary/70 text-primary shadow-[0_0_30px_-12px_hsl(var(--primary)/0.7)]",
    link: "https://chain.link/",
  },
  {
    title: "Solana",
    desc: "Blockchain escolhida para o futuro token GRVM e a economia musical descentralizada.",
    icon: <SolanaLogo className="w-6 h-6" />,
    accent: "border-secondary/30 hover:border-secondary/70 text-foreground shadow-[0_0_30px_-12px_hsl(var(--secondary)/0.7)]",
    link: "https://solana.com/pt",
  },
  {
    title: "IA Groovium",
    desc: "Camada inteligente de reputação musical, descoberta social e curadoria.",
    icon: <Sparkles className="w-6 h-6 text-accent" />,
    accent: "border-accent/30 hover:border-accent/70 text-accent shadow-[0_0_30px_-12px_hsl(var(--accent)/0.7)]",
  },
];

const Web3StackSection = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-20 md:py-28 relative noise-bg">
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[140px]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Web3 Stack</span>
          <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold mt-2">
            Infraestrutura <span className="gradient-neon-text text-glow-blue">Web3 do Groovium</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {cards.map((c) => {
            const Wrapper: any = c.link ? "a" : "div";
            const wrapperProps = c.link
              ? { href: c.link, target: "_blank", rel: "noopener noreferrer" }
              : {};
            return (
              <Wrapper
                key={c.title}
                {...wrapperProps}
                className={`glass-card rounded-xl p-6 border ${c.accent} transition-all hover:scale-[1.02] block group`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-background/60 border border-border/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {c.icon}
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{c.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Web3StackSection;
