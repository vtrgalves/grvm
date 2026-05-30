import { useEffect, useState } from "react";
import { Crown, Lock, Check, Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getLevel } from "@/lib/levels";
import { marketplace_enabled } from "@/lib/marketplace";
import { useMarketplaceModal } from "@/components/app/MarketplaceComingSoonModal";

interface Perk {
  id: string;
  title: string;
  description: string;
  icon: string;
  required_level: string;
  required_points: number;
  cost_grv: number;
  supply: number;
  claimed_count: number;
  active: boolean;
}

const VipClub = () => {
  const { profile, user } = useAuth();
  const { open: openMarketplace } = useMarketplaceModal();
  const [perks, setPerks] = useState<Perk[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("vip_perks").select("*").eq("active", true).order("required_points"),
      user ? supabase.from("vip_claims").select("perk_id").eq("user_id", user.id) : Promise.resolve({ data: [] as any }),
    ]);
    if (p) setPerks(p as Perk[]);
    if (c) setClaimed(new Set((c as any[]).map(x => x.perk_id)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("vip-perks")
      .on("postgres_changes", { event: "*", schema: "public", table: "vip_perks" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleClaim = async (perk: Perk) => {
    if (!marketplace_enabled) {
      openMarketplace();
      return;
    }
    setBusy(perk.id);
    const { error } = await supabase.rpc("claim_vip_perk", { _perk_id: perk.id });
    setBusy(null);
    if (error) {
      toast({ title: "Não foi possível resgatar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Benefício desbloqueado! 🎉", description: perk.title });
    setClaimed(prev => new Set(prev).add(perk.id));
    load();
  };

  if (!profile || loading) return <div className="text-center text-muted-foreground py-10">Carregando Clube VIP...</div>;

  const userLevel = getLevel(profile.grv_points);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 border border-accent/30 box-glow-pink">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Crown className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">Clube VIP</h1>
            <p className="text-muted-foreground text-sm">
              Benefícios exclusivos por nível. Você é <span className="text-accent font-bold">{userLevel.name}</span> com{" "}
              <span className="text-primary font-bold">{profile.grv_points.toLocaleString("pt-BR")} GRVM</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perks.map((perk) => {
          const unlocked = profile.grv_points >= perk.required_points;
          const isClaimed = claimed.has(perk.id);
          const soldOut = perk.claimed_count >= perk.supply;
          const canAfford = profile.grv_points >= perk.cost_grv;

          return (
            <div
              key={perk.id}
              className={`glass-card rounded-2xl p-5 border transition-all ${
                isClaimed
                  ? "border-primary/50 box-glow-blue"
                  : unlocked
                  ? "border-accent/30 hover:border-accent"
                  : "border-border/40 opacity-70"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl">{perk.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-display uppercase tracking-wider">
                      {perk.required_level}
                    </span>
                    {isClaimed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-display uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" /> Resgatado
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-lg">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{perk.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <div className="text-xs text-muted-foreground">
                  {perk.cost_grv > 0 ? (
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-primary" />
                      <span className="font-display font-bold text-primary">{perk.cost_grv} GRVM</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-accent">
                      <Sparkles className="w-3 h-3" /> Grátis
                    </span>
                  )}
                  <span className="block mt-0.5">
                    {perk.supply - perk.claimed_count} de {perk.supply} disponíveis
                  </span>
                </div>

                {isClaimed ? (
                  <Button size="sm" variant="ghost" disabled className="text-primary">
                    <Check className="w-4 h-4 mr-1" /> Seu
                  </Button>
                ) : soldOut ? (
                  <Button size="sm" variant="ghost" disabled>Esgotado</Button>
                ) : !unlocked ? (
                  <Button size="sm" variant="ghost" disabled>
                    <Lock className="w-4 h-4 mr-1" /> Nível {perk.required_level}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleClaim(perk)}
                    disabled={busy === perk.id || (perk.cost_grv > 0 && !canAfford)}
                    className="bg-gradient-to-r from-primary to-accent text-background font-display font-bold"
                  >
                    {busy === perk.id ? "..." : perk.cost_grv > 0 ? (canAfford ? "Resgatar" : "GRVM insuficiente") : "Resgatar"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VipClub;
