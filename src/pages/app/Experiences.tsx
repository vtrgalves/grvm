import { Ticket } from "lucide-react";

const mock = [
  { name: "Meet & Greet Virtual", price: 500, status: "Disponível", emoji: "🎤" },
  { name: "Show VIP — Drop", price: 1200, status: "Disponível", emoji: "🎟" },
  { name: "Sessão exclusiva no estúdio", price: 3000, status: "Em breve", emoji: "🎹" },
  { name: "Encontro Backstage", price: 5000, status: "Em breve", emoji: "🎸" },
];

const Experiences = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
        <Ticket className="w-6 h-6 text-accent" /> Experiências
      </h1>
      <p className="text-muted-foreground text-sm mt-1">Use seus GRV para viver momentos exclusivos (preview).</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mock.map((e, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 border border-border/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-3xl">{e.emoji}</div>
            <div className="flex-1">
              <div className="font-display font-bold">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.status}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-accent">{e.price} GRV</div>
              <button className="text-xs text-muted-foreground hover:text-foreground" disabled>Em breve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default Experiences;
