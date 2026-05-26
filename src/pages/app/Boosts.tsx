import { useEffect, useMemo, useState } from "react";
import { Zap, Coins, Lock, Sparkles, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BOOSTS, RARITY_LABEL, RARITY_COLOR, formatRemaining, type BoostRarity, type BoostDef } from "@/lib/boosts";
import { useGrvFx } from "@/components/app/GrvFxProvider";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ActiveBoost {
  id: string; slug: string; name: string; effect: string; icon: string;
  rarity: BoostRarity; expires_at: string;
}

const RARITIES: (BoostRarity | "all")[] = ["all", "common", "rare", "epic", "legendary"];

export default function Boosts() {
  const { user, profile, refreshProfile } = useAuth();
  const { notifyGain } = useGrvFx();
  const [active, setActive] = useState<ActiveBoost[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<BoostRarity | "all">("all");

  const loadActive = () => {
    (supabase.rpc as any)("get_active_boosts").then(({ data }: any) => data && setActive(data));
  };
  useEffect(() => { if (user) loadActive(); }, [user]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeSlugs = useMemo(() => new Set(active.filter(b => new Date(b.expires_at).getTime() > now).map(b => b.slug)), [active, now]);

  const activate = async (b: BoostDef) => {
    if (!profile) return;
    if (activeSlugs.has(b.slug)) { toast("Boost já ativo"); return; }
    if (profile.grv_points < b.cost) { toast.error("GRVM insuficiente"); return; }
    if (profile.grv_points < b.requiredPoints) { toast.error("Nível insuficiente"); return; }

    setLoading(b.slug);
    const { data, error } = await (supabase.rpc as any)("activate_boost", { _slug: b.slug });
    setLoading(null);
    if (error) { toast.error(error.message); return; }
    if (data?.success) {
      notifyGain(-b.cost, `Boost ${b.name}`);
      toast.success(`⚡ ${b.name} ativado!`, { description: b.effect });
      await refreshProfile();
      loadActive();
    }
  };

  const filtered = filter === "all" ? BOOSTS : BOOSTS.filter(b => b.rarity === filter);
  const validActive = active.filter(b => new Date(b.expires_at).getTime() > now);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative glass-card rounded-3xl p-6 md:p-8 border border-primary/30 overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <Zap className="w-7 h-7 text-background" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-black gradient-neon-text">Loja de Boosts</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-display uppercase tracking-wider text-primary/80 border border-primary/30 rounded-full px-2 py-0.5">⚡ Chainlink Verified Activity</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">Acelere sua evolução, destaque seu perfil e domine o ecossistema.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-primary">{(profile?.grv_points ?? 0).toLocaleString("pt-BR")} GRVM</span>
          </div>
        </div>
      </div>

      {/* Active boosts strip */}
      {validActive.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-accent/30 box-glow-pink">
          <h2 className="font-display text-sm font-bold mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-accent" /> Boosts ativos agora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {validActive.map(b => {
              const rem = new Date(b.expires_at).getTime() - now;
              return (
                <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl bg-background/40 border ${RARITY_COLOR[b.rarity]}`}>
                  <div className="text-2xl">{b.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm truncate">{b.name}</div>
                    <div className="font-mono text-xs tabular-nums">⏳ {formatRemaining(rem)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="w-full grid grid-cols-5">
          {RARITIES.map(r => (
            <TabsTrigger key={r} value={r}>{r === "all" ? "Tudo" : RARITY_LABEL[r as BoostRarity]}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={filter} className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((b) => {
              const isActiveBoost = activeSlugs.has(b.slug);
              const locked = (profile?.grv_points ?? 0) < b.requiredPoints;
              const cantAfford = (profile?.grv_points ?? 0) < b.cost;
              return (
                <div
                  key={b.slug}
                  className={`group relative glass-card rounded-2xl p-5 border ${RARITY_COLOR[b.rarity]} bg-gradient-to-br ${b.color} hover:scale-[1.02] transition-all ${b.glow}`}
                >
                  {b.limited && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-accent text-background text-[10px] font-display font-black uppercase tracking-wider animate-pulse">
                      {b.limited.tag} · {b.limited.until}
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-background/40 backdrop-blur flex items-center justify-center text-3xl border border-white/10">
                      {b.icon}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-display font-bold px-2 py-1 rounded-full border ${RARITY_COLOR[b.rarity]} bg-background/30`}>
                      {RARITY_LABEL[b.rarity]}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-lg mb-1">{b.name}</h3>
                  <div className="text-xs font-display text-foreground/80 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {b.effect}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{b.description}</p>

                  <div className="flex items-center justify-between mb-3 text-[11px] text-muted-foreground">
                    <span>Duração: <b className="text-foreground">{b.durationMin >= 60 ? `${b.durationMin / 60}h` : `${b.durationMin}min`}</b></span>
                    {b.requiredPoints > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {b.requiredPoints} GRVM
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => activate(b)}
                    disabled={isActiveBoost || locked || cantAfford || loading === b.slug}
                    className={`w-full py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                      isActiveBoost
                        ? "bg-accent/20 text-accent border border-accent/40 cursor-default"
                        : locked
                        ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                        : cantAfford
                        ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-accent text-background hover:scale-[1.02] animate-pulse-glow"
                    }`}
                  >
                    {loading === b.slug ? "Ativando..." :
                      isActiveBoost ? "✓ Ativo" :
                      locked ? `🔒 ${b.requiredPoints} GRVM` :
                      cantAfford ? `GRVM insuficiente` :
                      <span className="inline-flex items-center gap-2 justify-center">
                        <Coins className="w-4 h-4" /> Ativar · {b.cost.toLocaleString("pt-BR")} GRVM
                      </span>}
                  </button>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
