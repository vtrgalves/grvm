import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Hash, Sparkles, ExternalLink, Filter, Crown, Loader2, Award, ChevronDown } from "lucide-react";
import { normalizeRank, rankForScore, RANK_STYLES } from "@/lib/oracle";
import { explorerTxUrl, isSolanaSignature } from "@/lib/solana";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OracleSyncCard } from "@/components/app/OracleSyncPanel";
import { OracleDemoModal } from "@/components/app/OracleDemoModal";
import { PremiumProofModal, type PremiumProofView } from "@/components/app/OracleSuccessModal";

type PremiumProof = {
  id: string; action: string; label: string; icon: string; points: number;
  reputation_delta: number; oracle_synced: boolean;
  tx_hash: string | null; explorer_url: string | null; chain: string | null;
  created_at: string;
};


type Row = {
  id: string;
  groove_score: number;
  ai_insight: string | null;
  ai_profile: string | null;
  ai_rank: string | null;
  tx_hash: string;
  block_number: number | null;
  slot: number | null;
  chain: string | null;
  explorer_url: string | null;
  oracle_hash: string | null;
  trigger_event: string | null;
  external_data: Record<string, unknown> | null;
  created_at: string;
};

const RANGES: { key: "today" | "week" | "month" | "all"; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "week",  label: "Semana" },
  { key: "month", label: "Mês" },
  { key: "all",   label: "Tudo" },
];

function shortHash(h: string | null) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

export default function OracleHistory() {
  const [range, setRange] = useState<"today" | "week" | "month" | "all">("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState<number>(0);
  const [proofs, setProofs] = useState<PremiumProof[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumModalProofs, setPremiumModalProofs] = useState<PremiumProofView[]>([]);
  const [premiumModalCount, setPremiumModalCount] = useState(0);

  const loadProofs = async () => {
    const { data } = await (supabase.rpc as any)("get_user_premium_proofs", { _limit: 50 });
    setProofs((data as PremiumProof[]) ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const [hist, rep] = await Promise.all([
        supabase.rpc("get_oracle_history", { _range: range }),
        user ? supabase.rpc("compute_reputation_score", { _uid: user.id }) : Promise.resolve({ data: 0 }),
      ]);
      if (cancelled) return;
      setRows(((hist.data as Row[]) ?? []));
      setReputation(Number(rep.data ?? 0));
      setLoading(false);
      await loadProofs();
    })();
    return () => { cancelled = true; };
  }, [range]);

  const handleSyncPremium = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("premium-proof-sync", { body: {} });
      if (error) throw error;
      const n = (data as any)?.processed ?? 0;
      await loadProofs();
      if (n > 0) {
        // Pick the n most-recent synced proofs to show in the modal.
        const { data: latest } = await (supabase.rpc as any)("get_user_premium_proofs", { _limit: 50 });
        const synced = ((latest as PremiumProof[]) ?? []).filter((p) => p.oracle_synced).slice(0, n);
        const views: PremiumProofView[] = synced.map((p) => ({
          label: p.label,
          icon: p.icon,
          txHash: p.tx_hash,
          explorerUrl: p.explorer_url ?? (isSolanaSignature(p.tx_hash) ? explorerTxUrl(p.tx_hash!) : null),
          reputationDelta: p.reputation_delta,
          chain: p.chain,
          createdAt: p.created_at,
        }));
        if (views.length > 0) {
          setPremiumModalProofs(views);
          setPremiumModalCount(n);
          setPremiumModalOpen(true);
        } else {
          toast.success(`${n} prova(s) registrada(s) na Devnet`);
        }
      } else {
        toast.info("Nenhuma prova pendente");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao sincronizar provas");
    } finally {
      setSyncing(false);
    }
  };

  const pending = proofs.filter((p) => !p.oracle_synced).length;
  const currentRank = rankForScore(reputation);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Oracle History
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Histórico verificável de cada sincronização do Proof of Support Oracle. Suas ações musicais viram
            reputação registrada publicamente na Solana Devnet.
          </p>
        </div>
        <OracleDemoModal />
      </div>

      {/* Resumo para jurados */}
      <div className="glass-card rounded-2xl border border-accent/40 p-5 md:p-6 bg-gradient-to-br from-accent/5 via-background/40 to-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-accent font-display">Resumo para jurados</div>
            <p className="text-sm md:text-base text-foreground mt-1 leading-relaxed">
              O Groovium usa <strong className="text-secondary">Chainlink CRE</strong> para orquestrar dados, IA e blockchain.
              Cada interação musical gera reputação verificável. A <strong className="text-primary">Solana Devnet</strong> registra
              provas públicas da jornada do fã, criando uma camada de confiança para a futura economia GRVM.
            </p>
          </div>
        </div>
      </div>

      <OracleSyncCard
        headerExtra={<OracleDemoModal />}
        onSynced={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          const [hist, rep] = await Promise.all([
            supabase.rpc("get_oracle_history", { _range: range }),
            user ? supabase.rpc("compute_reputation_score", { _uid: user.id }) : Promise.resolve({ data: 0 }),
          ]);
          setRows(((hist.data as Row[]) ?? []));
          setReputation(Number(rep.data ?? 0));
          await loadProofs();
        }}
      />


      <div className="glass-card rounded-2xl border border-primary/30 p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reputation Score atual</div>
          <div className="font-display text-4xl md:text-5xl font-bold gradient-neon-text mt-1">
            {reputation}<span className="text-base text-muted-foreground">/1000</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rank</div>
          <span className={`mt-1 inline-block px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border ${RANK_STYLES[currentRank]}`}>
            {currentRank}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border transition-all ${
              range === r.key
                ? "bg-primary text-background border-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando histórico Oracle…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma sincronização nesse período. Volte ao Dashboard e rode o Oracle.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {rows.map((r) => {
              const rank = normalizeRank(r.ai_rank, Number(r.groove_score));
              const explorerHref =
                r.explorer_url ?? (isSolanaSignature(r.tx_hash) ? explorerTxUrl(r.tx_hash) : null);
              return (
                <div key={r.id} className="px-4 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold text-sm">
                        {Math.round(Number(r.groove_score))}<span className="text-muted-foreground">/1000</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider border ${RANK_STYLES[rank]}`}>
                        {rank}
                      </span>
                      {r.chain && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border/40 rounded-full px-2 py-0.5">
                          {r.chain}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                  </div>

                  {r.ai_insight && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="text-primary font-bold">{r.ai_profile ?? "Groover"}</span> — {r.ai_insight}
                    </p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {shortHash(r.tx_hash)}
                    </span>
                    {r.oracle_hash && (
                      <span className="flex items-center gap-1">
                        oracle: {shortHash(r.oracle_hash)}
                      </span>
                    )}
                    {explorerHref && (
                      <a
                        href={explorerHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        Solana Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Proofs Individuais */}
      <div className="glass-card rounded-2xl border border-accent/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent" />
            <span className="font-display text-sm font-bold">Premium Proofs Individuais</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {pending > 0 ? `${pending} pendente(s)` : "tudo sincronizado"}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleSyncPremium}
            disabled={syncing || pending === 0}
            className="bg-gradient-to-r from-accent to-primary text-background font-display font-bold"
          >
            {syncing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Crown className="w-3 h-3 mr-1" />}
            Sincronizar na Devnet
          </Button>
        </div>
        {proofs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Conquiste NFTs, VIP, badges ou crates lendárias para gerar provas individuais.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {proofs.map((p) => {
              const href = p.explorer_url ?? (isSolanaSignature(p.tx_hash) ? explorerTxUrl(p.tx_hash!) : null);
              return (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                  <div className="text-xl shrink-0">{p.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-[11px] font-bold uppercase tracking-wider text-accent">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground">• {timeAgo(p.created_at)} atrás</span>
                      {p.oracle_synced ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">on-chain</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted-foreground uppercase tracking-wider">pendente</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {shortHash(p.tx_hash)}</span>
                      <span className="uppercase tracking-wider">{p.chain ?? "pending"}</span>
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                          explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="font-display font-bold text-sm shrink-0 text-accent">+{p.reputation_delta} REP</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
        🔗 Cada sincronização agrega N Smart Actions em uma única prova verificável.
        Ações premium recebem hash individual na Solana Devnet.
      </p>
    </div>
  );
}
