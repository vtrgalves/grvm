import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RARITY_META, type CrateRarity } from "@/lib/crates";

interface Item {
  id: string; prize_rarity: CrateRarity; prize_name: string; prize_icon: string;
  crate_name: string; created_at: string;
}

export default function RecentCrateRewards() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    (supabase.rpc as any)("get_crate_history", { _limit: 4 })
      .then(({ data }: any) => data && setItems(data));
  }, []);

  if (items.length === 0) {
    return (
      <Link to="/app/crates"
        className="block glass-card rounded-2xl p-5 border border-accent/30 hover:border-accent transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-fuchsia-500 flex items-center justify-center">
            <Package className="w-5 h-5 text-background" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold text-sm">Abrir sua primeira Crate</div>
            <div className="text-[10px] text-muted-foreground">NFTs, boosts e GRV te esperam</div>
          </div>
          <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-accent/20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-bold flex items-center gap-2">
          <Package className="w-4 h-4 text-accent" /> Últimas Recompensas
        </h2>
        <Link to="/app/crates" className="text-xs text-accent hover:underline">Abrir mais</Link>
      </div>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.id} className={`flex items-center gap-3 p-2 rounded-lg bg-background/40 border ${RARITY_META[i.prize_rarity].border}`}>
            <div className="text-xl">{i.prize_icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-xs truncate">{i.prize_name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{i.crate_name}</div>
            </div>
            <span className={`text-[9px] uppercase font-display font-black ${RARITY_META[i.prize_rarity].color}`}>
              {RARITY_META[i.prize_rarity].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
