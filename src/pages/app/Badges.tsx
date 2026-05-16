import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Flame, Lock, CheckCircle2, Sparkles } from "lucide-react";

type Rarity = "common" | "rare" | "epic" | "legendary";
interface BadgeRow {
  id: string; slug: string; title: string; description: string; icon: string;
  rarity: Rarity; burn_cost: number; supply: number; claimed_count: number;
  required_level: string | null; owned: boolean;
}

const rarityStyles: Record<Rarity, { ring: string; text: string; label: string }> = {
  common:    { ring: "ring-muted-foreground/30",  text: "text-muted-foreground", label: "Comum" },
  rare:      { ring: "ring-primary/50",           text: "text-primary",          label: "Rara" },
  epic:      { ring: "ring-accent/60",            text: "text-accent",           label: "Épica" },
  legendary: { ring: "ring-yellow-400/70",        text: "text-yellow-400",       label: "Lendária" },
};

export default function Badges() {
  const { profile, refreshProfile } = useAuth();
  const [items, setItems] = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BadgeRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_badges_catalog");
    if (error) toast.error(error.message);
    setItems((data as BadgeRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleBurn = async () => {
    if (!selected) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("burn_for_badge", { _badge_id: selected.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`🔥 ${selected.burn_cost} GRV queimados`, { description: `Você desbloqueou: ${selected.title}` });
    setSelected(null);
    await Promise.all([load(), refreshProfile?.()]);
  };

  const balance = profile?.grv_points ?? 0;

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-accent" />
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-neon-text">Conquistas & Burn</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Queime GRV permanentemente para desbloquear badges raras. Pontos queimados saem da economia para sempre — só o prestígio fica.
        </p>
        <div className="inline-flex items-center gap-2 text-sm glass-card px-3 py-1.5 rounded-full border border-border/40">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="font-display">Saldo:</span>
          <span className="gradient-neon-text font-bold">{balance} GRV</span>
        </div>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => {
            const r = rarityStyles[b.rarity];
            const soldOut = b.claimed_count >= b.supply;
            const cannotAfford = balance < b.burn_cost;
            const disabled = b.owned || soldOut || cannotAfford;

            return (
              <div
                key={b.id}
                className={`relative glass-card rounded-2xl p-5 border border-border/40 ring-2 ${r.ring} transition-all hover:scale-[1.02] ${b.owned ? "opacity-100" : ""}`}
              >
                {b.owned && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  </div>
                )}
                <div className="text-5xl mb-3">{b.icon}</div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-lg">{b.title}</h3>
                </div>
                <Badge variant="outline" className={`${r.text} border-current text-xs mb-2`}>
                  {r.label}
                </Badge>
                <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">{b.description}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{b.claimed_count}/{b.supply} resgatadas</span>
                  <span className="flex items-center gap-1 font-bold text-accent">
                    <Flame className="w-3 h-3" /> {b.burn_cost} GRV
                  </span>
                </div>

                <Button
                  onClick={() => setSelected(b)}
                  disabled={disabled}
                  className={`w-full ${b.owned ? "" : "bg-gradient-to-r from-accent to-primary text-background font-bold"}`}
                  variant={b.owned ? "outline" : "default"}
                >
                  {b.owned ? (<><CheckCircle2 className="w-4 h-4 mr-1" /> Desbloqueada</>)
                    : soldOut ? (<><Lock className="w-4 h-4 mr-1" /> Esgotada</>)
                    : cannotAfford ? (<><Lock className="w-4 h-4 mr-1" /> GRV insuficiente</>)
                    : (<><Flame className="w-4 h-4 mr-1" /> Queimar GRV</>)}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <AlertDialogContent className="glass-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2">
              <span className="text-3xl">{selected?.icon}</span> Queimar {selected?.burn_cost} GRV?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong className="text-accent">permanente</strong>. Os pontos serão destruídos e você
              receberá a badge <strong>"{selected?.title}"</strong> no seu perfil. Não há reembolso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleBurn(); }}
              disabled={busy}
              className="bg-gradient-to-r from-accent to-primary text-background font-bold"
            >
              <Flame className="w-4 h-4 mr-1" /> {busy ? "Queimando..." : "Confirmar burn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
