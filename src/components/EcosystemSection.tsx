import { Disc3, Radio, ShoppingBag, Gift } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const cards = [
  {
    icon: Disc3,
    title: "NFTs Musicais",
    desc: "Transforme músicas em ativos digitais únicos",
    glow: "hover:box-glow-blue hover:border-primary/40",
  },
  {
    icon: Radio,
    title: "Streaming Descentralizado",
    desc: "Liberdade para artistas e fãs",
    glow: "hover:box-glow-purple hover:border-secondary/40",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    desc: "Compre, venda e monetize experiências musicais",
    glow: "hover:box-glow-magenta hover:border-accent/40",
  },
  {
    icon: Gift,
    title: "Rewards",
    desc: "Ganhe tokens por engajamento e participação",
    glow: "hover:box-glow-blue hover:border-primary/40",
  },
];

const EcosystemSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/4 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
          Um ecossistema <span className="gradient-neon-text text-glow-blue">completo</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {cards.map(({ icon: Icon, title, desc, glow }, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center p-8 rounded-2xl glass-card transition-all duration-300 hover:scale-105 group ${glow}`}
            >
              <div className="p-4 rounded-full bg-muted/50 mb-6 group-hover:scale-110 transition-transform">
                <Icon size={32} className="text-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-display text-lg font-bold mb-3">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
