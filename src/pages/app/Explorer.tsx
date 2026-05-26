import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, Boxes, Coins, Flame, Users, Zap, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TxRow {
  id: string;
  user_id: string;
  user_name: string;
  user_level: string;
  action: string;
  points: number;
  description: string | null;
  created_at: string;
  tx_hash: string;
}

interface Stats {
  total_tx: number;
  total_grv_minted: number;
  total_grv_burned: number;
  total_wallets: number;
  tx_24h: number;
}

const FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: "Tudo" },
  { key: "mission_complete", label: "Missões" },
  { key: "post_create", label: "Posts" },
  { key: "item_purchase", label: "Compras" },
  { key: "item_sale", label: "Vendas" },
  { key: "signup_bonus", label: "Cadastros" },
];

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  signup_bonus:     { label: "MINT • signup",     color: "text-primary",   icon: "🎁" },
  mission_complete: { label: "MINT • mission",    color: "text-primary",   icon: "🎯" },
  post_create:      { label: "MINT • post",       color: "text-primary",   icon: "📡" },
  post_like:        { label: "MINT • like",       color: "text-primary",   icon: "❤️" },
  post_comment:     { label: "MINT • comment",    color: "text-primary",   icon: "💬" },
  item_purchase:    { label: "BURN • purchase",   color: "text-accent",    icon: "🛒" },
  item_sale:        { label: "TRANSFER • sale",   color: "text-secondary", icon: "💎" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const Explorer = () => {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async (f: string | null) => {
    setLoading(true);
    const [{ data: feed }, { data: s }] = await Promise.all([
      supabase.rpc("get_explorer_feed", { _limit: 100, _filter: f }),
      supabase.rpc("get_explorer_stats"),
    ]);
    setRows((feed as TxRow[]) ?? []);
    setStats((s as unknown as Stats) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  // Realtime: a nova transação aparece no topo
  useEffect(() => {
    const ch = supabase
      .channel("explorer-tx")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "point_transactions" }, () => {
        load(filter);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  const copy = (h: string) => {
    navigator.clipboard.writeText(h);
    setCopied(h);
    toast.success("Hash copiado");
    setTimeout(() => setCopied(null), 1500);
  };

  const statCards = useMemo(() => ([
    { label: "Transações", value: stats?.total_tx ?? 0, icon: Activity, color: "text-primary border-primary/30" },
    { label: "GRVM Emitidos", value: stats?.total_grv_minted ?? 0, icon: Coins, color: "text-primary border-primary/30" },
    { label: "GRVM Queimados", value: stats?.total_grv_burned ?? 0, icon: Flame, color: "text-accent border-accent/30" },
    { label: "Carteiras", value: stats?.total_wallets ?? 0, icon: Users, color: "text-secondary border-secondary/30" },
    { label: "Atividade 24h", value: stats?.tx_24h ?? 0, icon: Zap, color: "text-primary border-primary/30" },
  ]), [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
          <Boxes className="w-6 h-6 text-primary" /> Explorer Web3
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visualize todas as transações da blockchain simulada Groovium em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className={`glass-card rounded-2xl p-4 border ${c.color}`}>
            <div className="flex items-center justify-between">
              <c.icon className="w-4 h-4 opacity-70" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
            </div>
            <div className="font-display text-xl md:text-2xl font-bold mt-2">
              {c.value.toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border transition-all ${
              filter === f.key
                ? "bg-primary text-background border-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <span className="font-display text-sm font-bold">Últimas transações</span>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> ao vivo
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Sincronizando rede...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma transação encontrada.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {rows.map((r) => {
              const meta = ACTION_META[r.action] ?? { label: r.action.toUpperCase(), color: "text-foreground", icon: "🔹" };
              const positive = r.points >= 0;
              return (
                <div key={r.id} className="px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-3 flex-wrap md:flex-nowrap">
                  <div className="text-xl shrink-0">{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-display text-[11px] font-bold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">• {timeAgo(r.created_at)} atrás</span>
                    </div>
                    <div className="text-sm truncate mt-0.5">
                      <span className="font-bold">{r.user_name}</span>
                      <span className="text-muted-foreground"> · {r.user_level}</span>
                      {r.description && <span className="text-muted-foreground"> — {r.description}</span>}
                    </div>
                    <button
                      onClick={() => copy(r.tx_hash)}
                      className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors mt-0.5 flex items-center gap-1"
                      title="Copiar hash"
                    >
                      {copied === r.tx_hash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="truncate max-w-[200px] md:max-w-none">{r.tx_hash}</span>
                    </button>
                  </div>
                  <div className={`font-display font-bold text-sm shrink-0 ${positive ? "text-primary" : "text-accent"}`}>
                    {positive ? "+" : ""}{r.points} GRVM
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 py-3 border-t border-border/40 text-center">
          <Button variant="ghost" size="sm" onClick={() => load(filter)} className="text-xs">
            Atualizar feed
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
        ⚡ Rede simulada Groovium Testnet · transações sem valor monetário real
      </p>
    </div>
  );
};

export default Explorer;
