import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { ChainlinkLogo } from "@/components/web3/ChainlinkLogo";
import { SolanaLogo } from "@/components/web3/SolanaLogo";
import {
  Pencil, ExternalLink, MapPin, Sparkles, Music2, Trophy, Users, Image as ImageIcon,
  Ticket, ShieldCheck, Wallet, Radio, Headphones, Zap, CheckCircle2, Lock, Crown,
} from "lucide-react";

const LEVEL_RANKS: Record<string, { label: string; color: string; next: number }> = {
  Listener: { label: "Rookie", color: "from-primary to-secondary", next: 1000 },
  Fan: { label: "Rising", color: "from-secondary to-accent", next: 2500 },
  Supporter: { label: "Viral", color: "from-accent to-primary", next: 5000 },
  Legend: { label: "Legendary", color: "from-accent to-primary", next: 10000 },
};

const MOCK_NFTS = [
  { id: 1, name: "Genesis Drop", rarity: "Genesis", color: "from-accent via-secondary to-primary" },
  { id: 2, name: "Synth Wave #042", rarity: "Epic", color: "from-secondary to-primary" },
  { id: 3, name: "Lo-fi Loop", rarity: "Rare", color: "from-primary to-secondary" },
  { id: 4, name: "First Beat", rarity: "Common", color: "from-muted to-muted-foreground/30" },
];

const RARITY_COLOR: Record<string, string> = {
  Genesis: "text-accent border-accent/50",
  Legendary: "text-accent border-accent/50",
  Epic: "text-secondary border-secondary/50",
  Rare: "text-primary border-primary/50",
  Common: "text-muted-foreground border-border",
};

const MOCK_EXPERIENCES = [
  { id: 1, title: "Meet & Greet Virtual", artist: "DJ Neon", cost: 1200, status: "Disponível" },
  { id: 2, title: "Backstage Digital", artist: "Luna Wave", cost: 2500, status: "Bloqueado" },
  { id: 3, title: "Audição Exclusiva", artist: "Synthkid", cost: 800, status: "Disponível" },
];

export default function ProfileEdit() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [oracle, setOracle] = useState<{ score: number; rank: string | null; updated_at: string } | null>(null);
  const [badgesCount, setBadgesCount] = useState(0);
  const [followsCount, setFollowsCount] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: oracleData }, { count: bCount }, { count: followers }, { count: following }] = await Promise.all([
        supabase.from("oracle_activity").select("groove_score,ai_rank,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      if (oracleData) setOracle({ score: oracleData.groove_score, rank: oracleData.ai_rank, updated_at: oracleData.created_at });
      setBadgesCount(bCount ?? 0);
      setFollowsCount({ followers: followers ?? 0, following: following ?? 0 });
    })();
  }, [user]);

  const handle = (profile as any)?.handle ?? "";
  const bio = (profile as any)?.bio ?? "";
  const grv = profile?.grv_points ?? 0;
  const level = profile?.level ?? "Listener";
  const rankInfo = LEVEL_RANKS[level] ?? LEVEL_RANKS.Listener;
  const xpProgress = Math.min(100, Math.round((grv / rankInfo.next) * 100));
  const genres = profile?.selected_genres ?? [];

  const journey = useMemo(
    () => [
      { label: "Conta criada", done: true, xp: 100 },
      { label: "Perfil personalizado", done: !!bio, xp: 50 },
      { label: "Primeiro gênero musical", done: genres.length > 0, xp: 75 },
      { label: "Primeira sincronização Oracle", done: !!oracle, xp: 200 },
      { label: "Primeiro NFT conquistado", done: false, xp: 500 },
      { label: "Próximo nível: Rising", done: false, xp: 1000, locked: true },
    ],
    [bio, genres.length, oracle]
  );

  const profileBadge = level === "Legend" ? "👑 Genesis Holder" : oracle ? "⚡ Early Supporter" : "🎧 Groove Explorer";

  return (
    <div className="space-y-6 pb-12">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 glass-card">
        {/* Banner */}
        <div className="relative h-44 md:h-56 bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(191_100%_50%/0.3),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(330_100%_55%/0.25),transparent_60%)]" />
          {/* equalizer bars */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 px-6 opacity-40">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm animate-pulse"
                style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
          {/* Edit button */}
          <Button
            onClick={() => setEditOpen(true)}
            size="sm"
            className="absolute top-4 right-4 bg-background/70 backdrop-blur-md border border-primary/40 text-foreground hover:bg-primary/20"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
          </Button>
        </div>

        {/* Avatar + Info */}
        <div className="px-6 md:px-8 pb-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary via-secondary to-accent p-[3px] shadow-[0_0_40px_hsl(191_100%_50%/0.5)]">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl gradient-neon-text">{(profile?.name?.[0] ?? "G").toUpperCase()}</span>
                  )}
                </div>
              </div>
              {/* Level badge */}
              <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider bg-gradient-to-r ${rankInfo.color} text-background shadow-lg`}>
                {rankInfo.label}
              </div>
            </div>

            {/* Name + handle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl md:text-3xl font-bold">{profile?.name ?? "Groover"}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                  {profileBadge}
                </span>
              </div>
              <p className="text-primary text-sm font-medium">@{handle || "sem_handle"}</p>
              {profile?.city && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {profile.city}
                </p>
              )}
              {bio && <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{bio}</p>}
            </div>

            {handle && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/u/${handle}`)} className="border-primary/30">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Ver perfil público
              </Button>
            )}
          </div>

          {/* XP bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest mb-2">
              <span className="text-muted-foreground">Groove XP</span>
              <span className="text-primary">{grv.toLocaleString()} / {rankInfo.next.toLocaleString()}</span>
            </div>
            <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${rankInfo.color} rounded-full shadow-[0_0_12px_hsl(191_100%_50%/0.6)] transition-all duration-700`}
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Seguidores", value: followsCount.followers, Icon: Users, color: "text-primary" },
          { label: "Seguindo", value: followsCount.following, Icon: Users, color: "text-secondary" },
          { label: "NFTs", value: MOCK_NFTS.length, Icon: ImageIcon, color: "text-accent" },
          { label: "Experiências", value: 0, Icon: Ticket, color: "text-primary" },
          { label: "Badges", value: badgesCount, Icon: Trophy, color: "text-accent" },
          { label: "GRVM", value: grv, Icon: Zap, color: "text-secondary" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-3 border border-border/40 hover:border-primary/30 transition-all hover:-translate-y-0.5">
            <s.Icon className={`w-4 h-4 ${s.color} mb-1`} />
            <p className="font-display text-lg font-bold">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ============ ORACLE + WEB3 ============ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Oracle */}
        <div className="glass-card rounded-2xl p-5 border border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <h3 className="font-display text-sm uppercase tracking-widest">Reputação Oracle</h3>
            </div>
            <ChainlinkLogo className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-display text-4xl font-bold gradient-neon-text">{oracle?.score ?? "—"}</span>
            <span className="text-sm text-muted-foreground">/ 1000</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Groove Score</p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rank</span>
              <span className="text-secondary font-medium">{oracle?.rank ?? "Não sincronizado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified by Chainlink CRE
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última sync</span>
              <span>{oracle ? new Date(oracle.updated_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Web3 Future */}
        <div className="glass-card rounded-2xl p-5 border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-[9px] border-accent/40 text-accent">BETA</Badge>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-accent" />
            <h3 className="font-display text-sm uppercase tracking-widest">Futuro Web3 GRVM</h3>
          </div>
          <ul className="space-y-2 text-xs">
            {[
              { Icon: Wallet, label: "Wallet Solana", status: "Em construção" },
              { Icon: ShieldCheck, label: "Reputation Oracle", status: "Ativo" },
              { Icon: ImageIcon, label: "NFTs conectados", status: "Em breve" },
              { Icon: Sparkles, label: "Proof of Support", status: "Ativo" },
            ].map((i) => (
              <li key={i.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <i.Icon className="w-3.5 h-3.5 text-accent" /> {i.label}
                </span>
                <span className="text-[10px] text-accent">{i.status}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30 text-[10px] text-muted-foreground">
            <ChainlinkLogo className="w-3 h-3" /> Powered by Chainlink CRE
            <span className="opacity-40">·</span>
            <SolanaLogo className="w-3 h-3" /> Future on Solana
          </div>
        </div>
      </section>

      {/* ============ MUSICAL IDENTITY ============ */}
      <section className="glass-card rounded-2xl p-5 border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Music2 className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-widest">Identidade Musical</h3>
        </div>
        {genres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span key={g} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/30 text-primary shadow-[0_0_8px_hsl(191_100%_50%/0.2)]">
                🎵 {g}
              </span>
            ))}
          </div>
        ) : (
          <button onClick={() => setEditOpen(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            + Adicione seus gêneros favoritos
          </button>
        )}
      </section>

      {/* ============ JOURNEY ============ */}
      <section className="glass-card rounded-2xl p-5 border border-border/40">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-4 h-4 text-accent" />
          <h3 className="font-display text-sm uppercase tracking-widest">Minha Jornada</h3>
        </div>
        <div className="space-y-3">
          {journey.map((j, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                j.done ? "bg-primary/20 border-primary text-primary shadow-[0_0_12px_hsl(191_100%_50%/0.4)]"
                : j.locked ? "bg-muted/30 border-border text-muted-foreground"
                : "bg-muted/30 border-border/60 text-muted-foreground"
              }`}>
                {j.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : j.locked ? <Lock className="w-3.5 h-3.5" /> : <span className="text-[10px]">○</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${j.done ? "" : "text-muted-foreground"}`}>{j.label}</p>
              </div>
              <span className={`text-[10px] font-display uppercase tracking-wider ${j.done ? "text-primary" : "text-muted-foreground"}`}>
                +{j.xp} XP
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ NFTs ============ */}
      <section className="glass-card rounded-2xl p-5 border border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-secondary" />
            <h3 className="font-display text-sm uppercase tracking-widest">Galeria NFT</h3>
          </div>
          <button onClick={() => navigate("/app/nfts")} className="text-[10px] text-primary hover:underline uppercase tracking-wider">Ver todos →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MOCK_NFTS.map((nft) => (
            <div key={nft.id} className="group relative rounded-xl border border-border/40 overflow-hidden hover:border-primary/40 transition-all hover:-translate-y-1 cursor-pointer">
              <div className={`aspect-square bg-gradient-to-br ${nft.color} relative`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent,hsl(0_0%_0%/0.4))]" />
                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                  <Music2 className="w-10 h-10" />
                </div>
              </div>
              <div className="p-2 bg-background/80">
                <p className="text-[11px] font-medium truncate">{nft.name}</p>
                <span className={`text-[9px] uppercase tracking-wider border rounded px-1 py-0.5 mt-1 inline-block ${RARITY_COLOR[nft.rarity]}`}>
                  {nft.rarity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ EXPERIENCES ============ */}
      <section className="glass-card rounded-2xl p-5 border border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Headphones className="w-4 h-4 text-accent" />
          <h3 className="font-display text-sm uppercase tracking-widest">Experiências desbloqueadas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_EXPERIENCES.map((e) => {
            const locked = e.status === "Bloqueado";
            return (
              <div key={e.id} className={`rounded-xl border p-4 transition-all ${locked ? "border-border/30 opacity-60" : "border-accent/30 hover:border-accent/60 hover:-translate-y-0.5"}`}>
                <div className="flex items-start justify-between mb-2">
                  <Radio className={`w-5 h-5 ${locked ? "text-muted-foreground" : "text-accent"}`} />
                  {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <p className="font-display text-sm font-bold">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{e.artist}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                  <span className="text-[10px] text-accent font-medium">{e.cost} GRVM</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{e.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ SOCIAL ============ */}
      <section className="glass-card rounded-2xl p-5 border border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-display text-sm uppercase tracking-widest">Conexões</h3>
          </div>
          <button onClick={() => navigate("/app/ranking")} className="text-[10px] text-primary hover:underline uppercase tracking-wider">Explorar →</button>
        </div>
        {followsCount.followers + followsCount.following === 0 ? (
          <p className="text-xs text-muted-foreground">Você ainda não tem conexões. Conecte-se com artistas e fãs no Explorer.</p>
        ) : (
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(8, followsCount.followers) }).map((_, i) => (
              <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border border-primary/30 -ml-2 first:ml-0" />
            ))}
            <span className="ml-3 text-xs text-muted-foreground">{followsCount.followers} fãs conectados</span>
          </div>
        )}
      </section>

      <EditProfileModal open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
