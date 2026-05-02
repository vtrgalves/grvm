import { Image as ImageIcon, Lock } from "lucide-react";

const mock = [
  { name: "Boas-vindas Groovium", type: "Acesso", emoji: "🎵", owned: true },
  { name: "Drop Inaugural", type: "Conteúdo", emoji: "💎", owned: true },
  { name: "Backstage Pass", type: "Status", emoji: "🎤", owned: false },
  { name: "Vinyl NFT #001", type: "Conteúdo", emoji: "🎧", owned: false },
  { name: "Legend Badge", type: "Status", emoji: "🏆", owned: false },
  { name: "Studio Session", type: "Acesso", emoji: "🎹", owned: false },
];

const NFTs = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
        <ImageIcon className="w-6 h-6 text-secondary" /> NFTs
      </h1>
      <p className="text-muted-foreground text-sm mt-1">Sua coleção de ativos digitais Groovium (preview).</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {mock.map((n, i) => (
        <div key={i} className={`glass-card rounded-2xl p-4 ${n.owned ? "border-primary/30" : "border-border/40 opacity-60"}`}>
          <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center text-5xl mb-3">
            {n.owned ? n.emoji : <Lock className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div className="font-display font-bold text-sm truncate">{n.name}</div>
          <div className="text-xs text-muted-foreground">{n.type}</div>
        </div>
      ))}
    </div>
  </div>
);
export default NFTs;
