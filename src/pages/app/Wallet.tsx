import { useEffect, useState } from "react";
import { Coins, ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SolanaLogo } from "@/components/web3/SolanaLogo";

interface Tx { id: string; action: string; points: number; description: string | null; created_at: string; }

const Wallet = () => {
  const { user, profile } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTxs(data as Tx[]); });
  }, [user]);

  const earnings = txs.filter(t => t.points > 0);
  const spendings = txs.filter(t => t.points < 0);

  const renderList = (list: Tx[]) =>
    list.length === 0 ? (
      <div className="text-center py-12 text-muted-foreground">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Complete uma missão para começar.</p>
      </div>
    ) : (
      <div className="space-y-2">
        {list.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.points >= 0 ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
              {t.points >= 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{t.description || t.action}</div>
              <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</div>
            </div>
            <div className={`font-display font-bold text-sm ${t.points >= 0 ? "text-primary" : "text-accent"}`}>
              {t.points >= 0 ? "+" : ""}{t.points} GRVM
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-8 border border-primary/20 box-glow-blue text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
          <Coins className="w-4 h-4 text-primary" /> Saldo atual
        </div>
        <div className="font-display text-5xl md:text-6xl font-black gradient-neon-text">
          {(profile?.grv_points ?? 0).toLocaleString("pt-BR")}
        </div>
        <div className="font-display text-sm text-muted-foreground mt-1">GRVM</div>
        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs text-accent uppercase tracking-wider font-display">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Modo Simulado · BETA
        </div>
      </div>

      {/* Future Solana Wallet */}
      <div className="glass-card rounded-2xl p-6 border border-secondary/30 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-background/60 border border-secondary/40 flex items-center justify-center shrink-0">
            <SolanaLogo className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display text-lg font-bold">Future Solana Wallet</h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 border border-secondary/40 text-[10px] font-display uppercase tracking-wider text-secondary">
                Web3 Expansion · In Development
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              A futura wallet GRVM será integrada à rede Solana para transações, NFTs e economia musical descentralizada.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">Tudo</TabsTrigger>
          <TabsTrigger value="in">Ganhos</TabsTrigger>
          <TabsTrigger value="out">Gastos</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList(txs)}</TabsContent>
        <TabsContent value="in" className="mt-4">{renderList(earnings)}</TabsContent>
        <TabsContent value="out" className="mt-4">{renderList(spendings)}</TabsContent>
      </Tabs>
    </div>
  );
};

export default Wallet;
