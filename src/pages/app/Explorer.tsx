import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Boxes, Coins, Flame, Users, Zap, Copy, Check, Sparkles, Hash, ExternalLink, Crown } from "lucide-react";
import { toast } from "sonner";
import { explorerTxUrl, isSolanaSignature } from "@/lib/solana";

interface TxRow {
  id: string; user_id: string; user_name: string; user_level: string;
  action: string; points: number; description: string | null;
  created_at: string; tx_hash: string;
}
interface Stats {
  total_tx: number; total_grv_minted: number; total_grv_burned: number;
  total_wallets: number; tx_24h: number;
}
interface SmartActionRow {
  id: string; user_id: string; user_name: string; action: string; label: string; icon: string;
  category: string; points: number; reputation_delta: number; premium: boolean;
  tx_hash: string | null; explorer_url: string | null; chain: string | null; created_at: string;
}
interface OracleSyncRow {
  id: string; user_id: string; user_name: string;
  groove_score: number; ai_rank: string | null; ai_profile: string | null;
  chain: string | null; tx_hash: string; explorer_url: string | null;
  actions_count: number; premium_count: number; created_at: string;
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
  signup_bonus:     { label: "MINT • signup",   color: "text-primary",   icon: "🎁" },
  mission_complete: { label: "MINT • mission",  color: "text-primary",   icon: "🎯" },
  post_create:      { label: "MINT • post",     color: "text-primary",   icon: "📡" },
  post_like:        { label: "MINT • like",     color: "text-primary",   icon: "❤️" },
  post_comment:     { label: "MINT • comment",  color: "text-primary",   icon: "💬" },
  item_purchase:    { label: "BURN • purchase", color: "text-accent",    icon: "🛒" },
  item_sale:        { label: "TRANSFER • sale", color: "text-secondary", icon: "💎" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
function shortHash(h: string | null) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

const Explorer = () => {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Smart Actions tab state
  const [saRows, setSaRows] = useState<SmartActionRow[]>([]);
  const [saPremiumOnly, setSaPremiumOnly] = useState(false);
  const [saLoading, setSaLoading] = useState(false);

  // Oracle Syncs tab state
  const [syncRows, setSyncRows] = useState<OracleSyncRow[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [openSync, setOpenSync] = useState<string | null>(null);
  const [syncActions, setSyncActions] = useState<Record<string, SmartActionRow[]>>({});

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

  const loadSmartActions = async () => {
    setSaLoading(true);
    const { data } = await (supabase.rpc as any)("get_smart_actions_global", {
      _limit: 80, _premium_only: saPremiumOnly,
    });
    setSaRows((data as SmartActionRow[]) ?? []);
    setSaLoading(false);
  };

  const loadSyncs = async () => {
    setSyncLoading(true);
    const { data } = await (supabase.rpc as any)("get_oracle_sync_feed", { _limit: 30 });
    setSyncRows((data as OracleSyncRow[]) ?? []);
    setSyncLoading(false);
  };

  const toggleSync = async (id: string) => {
    if (openSync === id) { setOpenSync(null); return; }
    setOpenSync(id);
    if (!syncActions[id]) {
      const { data } = await (supabase.rpc as any)("get_smart_actions_by_sync", { _sync_id: id });
      setSyncActions((prev) => ({ ...prev, [id]: (data as SmartActionRow[]) ?? [] }));
    }
  };

  useEffect(() => { load(filter); }, [filter]);
  useEffect(() => { loadSmartActions(); /* eslint-disable-next-line */ }, [saPremiumOnly]);
  useEffect(() => { loadSyncs(); }, []);

  // Realtime for tx feed
  useEffect(() => {
    const ch = supabase
      .channel("explorer-tx")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "point_transactions" }, () => load(filter))
      .on("postgres_changes", { event: "*", schema: "public", table: "smart_actions" }, () => loadSmartActions())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "oracle_activity" }, () => loadSyncs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [filter, saPremiumOnly]);

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
          Toda interação vira Smart Action. Cada Oracle Sync agrega as ações em uma prova on-chain.
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

      <Tabs defaultValue="tx" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="tx">Transações</TabsTrigger>
          <TabsTrigger value="smart">Smart Actions</TabsTrigger>
          <TabsTrigger value="syncs">Oracle Syncs</TabsTrigger>
        </TabsList>

        {/* TX FEED */}
        <TabsContent value="tx" className="mt-4 space-y-4">
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
                          <span className={`font-display text-[11px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
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
              <Button variant="ghost" size="sm" onClick={() => load(filter)} className="text-xs">Atualizar feed</Button>
            </div>
          </div>
        </TabsContent>

        {/* SMART ACTIONS */}
        <TabsContent value="smart" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaPremiumOnly(false)}
              className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border ${
                !saPremiumOnly ? "bg-primary text-background border-primary" : "border-border/40 text-muted-foreground"
              }`}
            >Todas</button>
            <button
              onClick={() => setSaPremiumOnly(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border flex items-center gap-1 ${
                saPremiumOnly ? "bg-accent text-background border-accent" : "border-border/40 text-muted-foreground"
              }`}
            ><Crown className="w-3 h-3" /> Premium Proofs</button>
          </div>
          <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
            {saLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando Smart Actions…</div>
            ) : saRows.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma Smart Action no momento.</div>
            ) : (
              <div className="divide-y divide-border/30">
                {saRows.map((a) => {
                  const href = a.explorer_url ?? (isSolanaSignature(a.tx_hash) ? explorerTxUrl(a.tx_hash!) : null);
                  return (
                    <div key={a.id} className="px-4 py-3 hover:bg-muted/20 flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <div className="text-xl shrink-0">{a.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-primary">{a.label}</span>
                          {a.premium && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent uppercase tracking-wider flex items-center gap-1">
                              <Crown className="w-3 h-3" /> premium
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">• {timeAgo(a.created_at)} atrás</span>
                        </div>
                        <div className="text-sm truncate mt-0.5">
                          <span className="font-bold">{a.user_name}</span>
                          <span className="text-muted-foreground"> · +{a.reputation_delta} REP · {a.category}</span>
                        </div>
                        {(a.tx_hash || a.chain) && (
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {shortHash(a.tx_hash)}</span>
                            <span className="uppercase tracking-wider">{a.chain ?? "pending"}</span>
                            {href && (
                              <a href={href} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                                explorer <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="font-display font-bold text-sm shrink-0 text-primary">+{a.points} GRVM</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ORACLE SYNCS */}
        <TabsContent value="syncs" className="mt-4 space-y-4">
          <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
            {syncLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando Oracle Syncs…</div>
            ) : syncRows.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum Oracle Sync registrado.</div>
            ) : (
              <div className="divide-y divide-border/30">
                {syncRows.map((s) => {
                  const open = openSync === s.id;
                  const href = s.explorer_url ?? (isSolanaSignature(s.tx_hash) ? explorerTxUrl(s.tx_hash) : null);
                  const inner = syncActions[s.id] ?? [];
                  return (
                    <div key={s.id} className="px-4 py-3 hover:bg-muted/10 transition-colors">
                      <button onClick={() => toggleSync(s.id)} className="w-full flex items-center gap-3 text-left">
                        <Sparkles className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-sm">{s.user_name}</span>
                            <span className="text-[10px] text-muted-foreground">• {timeAgo(s.created_at)} atrás</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/40 text-primary font-mono">
                              {Math.round(Number(s.groove_score))}/1000
                            </span>
                            {s.ai_rank && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-secondary/40 text-secondary uppercase tracking-wider">
                                {s.ai_rank}
                              </span>
                            )}
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {s.actions_count} ações · {s.premium_count} premium
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {shortHash(s.tx_hash)}</span>
                            <span className="uppercase tracking-wider">{s.chain ?? "pending"}</span>
                            {href && (
                              <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary flex items-center gap-1 hover:underline">
                                explorer <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
                      </button>
                      {open && (
                        <div className="mt-3 ml-7 pl-3 border-l border-border/30 space-y-1.5">
                          {inner.length === 0 ? (
                            <div className="text-[11px] text-muted-foreground italic">Nenhuma Smart Action vinculada a este sync.</div>
                          ) : inner.map((a) => (
                            <div key={a.id} className="flex items-center gap-2 text-xs">
                              <span className="text-base">{a.icon}</span>
                              <span className="font-display uppercase tracking-wider text-[10px] text-primary">{a.label}</span>
                              {a.premium && <Crown className="w-3 h-3 text-accent" />}
                              <span className="text-[10px] text-muted-foreground ml-auto">+{a.reputation_delta} REP</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
        ⚡ Rede Groovium · ações premium recebem TX individual na Solana Devnet
      </p>
    </div>
  );
};

export default Explorer;
