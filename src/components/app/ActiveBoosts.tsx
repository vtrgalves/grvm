import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatRemaining, RARITY_COLOR, type BoostRarity } from "@/lib/boosts";

interface ActiveBoost {
  id: string;
  slug: string;
  name: string;
  effect: string;
  icon: string;
  rarity: BoostRarity;
  expires_at: string;
}

export default function ActiveBoosts() {
  const { user } = useAuth();
  const [boosts, setBoosts] = useState<ActiveBoost[]>([]);
  const [now, setNow] = useState(Date.now());

  const load = () => {
    (supabase.rpc as any)("get_active_boosts").then(({ data }: any) => {
      if (data) setBoosts(data as ActiveBoost[]);
    });
  };

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    const r = setInterval(load, 30000);
    return () => { clearInterval(t); clearInterval(r); };
  }, [user]);

  const valid = boosts.filter(b => new Date(b.expires_at).getTime() > now);

  return (
    <div className="glass-card rounded-2xl p-5 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Boosts Ativos
        </h2>
        <Link to="/app/boosts" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Loja <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {valid.length === 0 ? (
        <Link to="/app/boosts" className="block text-center py-4 text-xs text-muted-foreground hover:text-primary transition-colors">
          Nenhum boost ativo. Ative um para acelerar sua jornada ⚡
        </Link>
      ) : (
        <div className="space-y-2">
          {valid.map(b => {
            const remaining = new Date(b.expires_at).getTime() - now;
            return (
              <div key={b.id} className={`flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border ${RARITY_COLOR[b.rarity]}`}>
                <div className="w-9 h-9 rounded-lg bg-background/40 flex items-center justify-center text-lg">{b.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm truncate">{b.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{b.effect}</div>
                </div>
                <div className="font-mono text-xs font-bold tabular-nums shrink-0">⏳ {formatRemaining(remaining)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
