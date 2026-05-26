import { useEffect, useRef, useState } from "react";
import { Package, Coins, History, Sparkles, Globe2, X, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGrvFx } from "@/components/app/GrvFxProvider";
import { CRATES, RARITY_META, REEL_POOL, type CrateDef, type CrateRarity } from "@/lib/crates";
import { toast } from "sonner";

interface OpeningResult {
  success: boolean; cost: number; rarity: CrateRarity;
  prize: { type: string; name: string; icon: string; grv: number };
  grv_awarded: number;
}

interface HistoryItem {
  id: string; crate_name: string; prize_rarity: CrateRarity;
  prize_name: string; prize_icon: string; prize_grv: number; created_at: string;
}

interface GlobalItem {
  id: string; user_name: string; crate_name: string;
  prize_rarity: CrateRarity; prize_name: string; prize_icon: string; created_at: string;
}

export default function Crates() {
  const { profile, refreshProfile } = useAuth();
  const { notifyGain } = useGrvFx();
  const [opening, setOpening] = useState<CrateDef | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "reveal">("idle");
  const [result, setResult] = useState<OpeningResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feed, setFeed] = useState<GlobalItem[]>([]);
  const reelRef = useRef<HTMLDivElement>(null);

  const loadHistory = () => (supabase.rpc as any)("get_crate_history", { _limit: 20 })
    .then(({ data }: any) => data && setHistory(data));
  const loadFeed = () => (supabase.rpc as any)("get_crate_global_feed", { _limit: 15 })
    .then(({ data }: any) => data && setFeed(data));

  useEffect(() => { loadHistory(); loadFeed(); }, []);

  const openCrate = async (c: CrateDef) => {
    if (!profile) return;
    if (profile.grv_points < c.cost) { toast.error("GRVM insuficiente"); return; }

    setOpening(c);
    setResult(null);
    setPhase("spinning");

    const [{ data, error }] = await Promise.all([
      (supabase.rpc as any)("open_crate", { _slug: c.slug }),
      new Promise(r => setTimeout(r, 3200)), // wait for animation
    ]);

    if (error) {
      toast.error(error.message);
      setPhase("idle"); setOpening(null);
      return;
    }
    const r = data as OpeningResult;
    setResult(r);
    setPhase("reveal");
    notifyGain(-c.cost, c.name);
    if (r.grv_awarded > 0) notifyGain(r.grv_awarded, `Prêmio ${RARITY_META[r.rarity].label}`);
    await refreshProfile();
    loadHistory(); loadFeed();
  };

  const close = () => { setOpening(null); setResult(null); setPhase("idle"); };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative glass-card rounded-3xl p-6 md:p-8 border border-accent/30 overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/15 via-accent/15 to-fuchsia-500/15 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-fuchsia-500 flex items-center justify-center animate-pulse-glow">
            <Package className="w-7 h-7 text-background" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-black gradient-neon-text">Crates</h1>
            <p className="text-sm text-muted-foreground mt-1">Abra mystery boxes e descubra NFTs, boosts e itens raros.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-primary">{(profile?.grv_points ?? 0).toLocaleString("pt-BR")} GRVM</span>
          </div>
        </div>
      </div>

      {/* Crate grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CRATES.map(c => {
          const cantAfford = (profile?.grv_points ?? 0) < c.cost;
          return (
            <div key={c.slug}
              className={`group relative glass-card rounded-2xl p-6 border-2 ${c.ring} bg-gradient-to-br ${c.gradient} ${c.glow} hover:scale-[1.03] transition-all overflow-hidden`}>
              {c.limited && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-orange-500 text-background text-[10px] font-display font-black uppercase tracking-wider animate-pulse">
                  ⏳ {c.limited.hours}h restantes
                </div>
              )}
              <div className="text-6xl mb-3 text-center group-hover:scale-110 transition-transform animate-pulse-glow inline-block w-full">
                {c.icon}
              </div>
              <h3 className="font-display text-xl font-black text-center mb-1">{c.name}</h3>
              <p className="text-xs text-muted-foreground text-center mb-4">{c.tagline}</p>

              {/* odds */}
              <div className="flex justify-between text-[10px] uppercase tracking-wider font-display mb-4 px-1">
                {(["common","rare","epic","legendary","genesis"] as CrateRarity[]).map(r => (
                  c.odds[r] > 0 && (
                    <div key={r} className="text-center">
                      <div>{RARITY_META[r].icon}</div>
                      <div className={`${RARITY_META[r].color} font-bold`}>{c.odds[r]}%</div>
                    </div>
                  )
                ))}
              </div>

              <button onClick={() => openCrate(c)} disabled={cantAfford}
                className={`w-full py-3 rounded-xl font-display font-black text-sm transition-all ${
                  cantAfford ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-accent text-background hover:scale-[1.02] animate-pulse-glow"
                }`}>
                <span className="inline-flex items-center gap-2 justify-center">
                  <Coins className="w-4 h-4" /> Abrir · {c.cost.toLocaleString("pt-BR")} GRVM
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* History + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-primary/20">
          <h2 className="font-display font-bold mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Histórico de Crates
          </h2>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Você ainda não abriu nenhuma crate.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {history.map(h => (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl bg-background/40 border ${RARITY_META[h.prize_rarity].border}`}>
                  <div className="text-2xl">{h.prize_icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm truncate">{h.prize_name}</div>
                    <div className="text-[10px] text-muted-foreground">{h.crate_name} · {new Date(h.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <span className={`text-[10px] uppercase font-display font-black ${RARITY_META[h.prize_rarity].color}`}>
                    {RARITY_META[h.prize_rarity].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 border border-accent/20">
          <h2 className="font-display font-bold mb-4 flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-accent" /> Atividade Global
          </h2>
          {feed.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Aguardando os primeiros prêmios raros...</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {feed.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40">
                  <div className="text-2xl">{f.prize_icon}</div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div><b className={RARITY_META[f.prize_rarity].color}>{f.user_name}</b> encontrou <b>{f.prize_name}</b></div>
                    <div className="text-[10px] text-muted-foreground">{f.crate_name}</div>
                  </div>
                  <Trophy className={`w-4 h-4 ${RARITY_META[f.prize_rarity].color}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opening overlay */}
      {opening && (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          {/* particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute w-1 h-1 rounded-full bg-primary animate-pulse-glow"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  boxShadow: "0 0 12px currentColor",
                  color: result ? `var(--accent)` : `hsl(var(--primary))`,
                }} />
            ))}
          </div>

          <button onClick={close} className="absolute top-6 right-6 p-2 rounded-full bg-background/60 hover:bg-background border border-border z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-xl text-center">
            {phase === "spinning" && (
              <>
                <div className="text-7xl mb-6 animate-pulse-glow inline-block">{opening.icon}</div>
                <h2 className="font-display text-3xl font-black gradient-neon-text mb-2">Abrindo {opening.name}...</h2>
                <p className="text-sm text-muted-foreground mb-8">Aguarde o veredito do ecossistema</p>

                {/* reel */}
                <div className="relative h-24 overflow-hidden rounded-2xl border-2 border-primary/40 bg-background/60">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-24 border-x-2 border-accent z-10 pointer-events-none box-glow-pink" />
                  <div ref={reelRef} className="flex items-center h-full gap-4 px-4"
                    style={{
                      animation: "crate-reel 3.2s cubic-bezier(0.15, 0.65, 0.25, 1) forwards",
                    }}>
                    {Array.from({ length: 8 }).flatMap((_, i) =>
                      REEL_POOL.map((p, j) => (
                        <div key={`${i}-${j}`} className="shrink-0 w-20 h-20 rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center">
                          <div className="text-3xl">{p.icon}</div>
                          <div className="text-[8px] text-muted-foreground truncate w-full text-center px-1">{p.name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {phase === "reveal" && result && (
              <div className="animate-scale-in">
                <div className="text-xs uppercase tracking-[0.3em] font-display mb-2 text-muted-foreground">
                  {RARITY_META[result.rarity].icon} {RARITY_META[result.rarity].label}
                </div>
                <div className={`inline-block text-9xl mb-6 animate-pulse-glow ${RARITY_META[result.rarity].glow} rounded-full p-8`}>
                  {result.prize.icon}
                </div>
                <h2 className={`font-display text-4xl md:text-5xl font-black mb-3 ${RARITY_META[result.rarity].color}`}
                  style={{ textShadow: "0 0 30px currentColor" }}>
                  {result.prize.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Encontrado em <b className="text-foreground">{opening.name}</b>
                </p>
                {result.grv_awarded > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/40 mb-6">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-display font-bold text-primary">+{result.grv_awarded} GRVM creditados</span>
                  </div>
                )}

                <div className="flex gap-3 justify-center mt-4">
                  <button onClick={close}
                    className="px-6 py-3 rounded-xl bg-muted hover:bg-muted/70 font-display font-bold text-sm">
                    Fechar
                  </button>
                  <button onClick={() => openCrate(opening)}
                    disabled={(profile?.grv_points ?? 0) < opening.cost}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-display font-black text-sm hover:scale-[1.02] animate-pulse-glow disabled:opacity-50">
                    Abrir outra · {opening.cost} GRVM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
