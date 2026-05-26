import { useEffect, useState } from "react";
import { Coins, ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
