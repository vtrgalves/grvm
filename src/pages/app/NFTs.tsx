import { useEffect, useState } from "react";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import ItemsGrid from "@/components/app/ItemsGrid";
import { supabase } from "@/integrations/supabase/client";

interface Item { id: string; title: string; image_url: string | null; price_grv: number; }

const OFFICIAL = [
  { name: "Groovium Genesis", rarity: "Lendária", image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=600&q=80" },
  { name: "Sound Wave Pass", rarity: "Épica", image: "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=600&q=80" },
  { name: "Neon Holographic", rarity: "Rara", image: "https://images.unsplash.com/photo-1635776063043-9bf649fc7c12?w=600&q=80" },
  { name: "Backstage Token", rarity: "Comum", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80" },
];

const rarityColor = (r: string) =>
  r === "Lendária" ? "from-yellow-500 to-orange-500" :
  r === "Épica" ? "from-purple-500 to-pink-500" :
  r === "Rara" ? "from-cyan-500 to-blue-500" : "from-slate-500 to-slate-700";

const NFTs = () => {
  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl p-6 border border-primary/30 box-glow-blue">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-black gradient-neon-text flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> NFTs Oficiais Groovium
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Coleção verificada no OpenSea — clique para visitar.</p>
          </div>
          <a
            href="https://opensea.io/collection/groovium"
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-background font-display font-bold text-sm hover:scale-105 transition-transform"
          >
            Ver Coleção <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OFFICIAL.map((n) => (
            <a key={n.name} href="https://opensea.io/collection/groovium" target="_blank" rel="noreferrer"
              className="group rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover-scale">
              <div className="aspect-square overflow-hidden relative">
                <img src={n.image} alt={n.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <span className={`absolute top-2 right-2 text-[9px] font-display uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r ${rarityColor(n.rarity)} text-white font-bold`}>
                  {n.rarity}
                </span>
              </div>
              <div className="p-2">
                <div className="text-xs font-display font-bold truncate">{n.name}</div>
                <div className="text-[10px] text-muted-foreground">Verificado · OpenSea</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <ItemsGrid kind="nft" />
    </div>
  );
};

export default NFTs;
