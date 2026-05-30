import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Flame,
  TrendingUp,
  Crown,
  Search,
  ShieldCheck,
  Wallet,
  Timer,
  Activity,
} from "lucide-react";
import ItemsGrid from "@/components/app/ItemsGrid";
import AiSuggestion from "@/components/app/AiSuggestion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import grooviumOfficialNft from "@/assets/groovium-nft-official.avif";
import { useMarketplaceModal } from "@/components/app/MarketplaceComingSoonModal";
import nftNeonPulse from "@/assets/nfts/neon-pulse.jpg";
import nftWaveAccess from "@/assets/nfts/wave-access.jpg";
import nftCyberFrequency from "@/assets/nfts/cyber-frequency.jpg";
import nftGenesisAura from "@/assets/nfts/genesis-aura.jpg";
import nftEternalGroove from "@/assets/nfts/eternal-groove.jpg";
import nftQuantumSound from "@/assets/nfts/quantum-sound.jpg";
import nftGenesisPrime from "@/assets/nfts/genesis-prime.jpg";
import nftEternalFounder from "@/assets/nfts/eternal-founder.jpg";
import nftFirstWave from "@/assets/nfts/first-wave.jpg";
import nftArtistNeonFrequency from "@/assets/nfts/artist-neon-frequency.jpg";
import nftArtistLunaVox from "@/assets/nfts/artist-luna-vox.jpg";
import nftArtistCyberGroove from "@/assets/nfts/artist-cybergroove.jpg";

// ---------- Rarity helpers ----------
type Rarity = "common" | "rare" | "epic" | "legendary" | "genesis" | "grail";

const RARITY: Record<
  Rarity,
  { label: string; icon: string; chip: string; ring: string; glow: string; border: string }
> = {
  common: {
    label: "Common",
    icon: "◇",
    chip: "from-slate-400 to-slate-600",
    ring: "ring-slate-300/30",
    glow: "shadow-[0_0_18px_hsl(0_0%_70%/0.18)]",
    border: "border-slate-400/30",
  },
  rare: {
    label: "Rare",
    icon: "◈",
    chip: "from-cyan-400 to-blue-500",
    ring: "ring-cyan-400/50",
    glow: "shadow-[0_0_22px_hsl(191_100%_50%/0.35)]",
    border: "border-cyan-400/50",
  },
  epic: {
    label: "Epic",
    icon: "◆",
    chip: "from-purple-500 to-fuchsia-500",
    ring: "ring-purple-400/50",
    glow: "shadow-[0_0_24px_hsl(270_80%_60%/0.45)]",
    border: "border-purple-400/50",
  },
  legendary: {
    label: "Legendary",
    icon: "✦",
    chip: "from-orange-400 to-rose-500",
    ring: "ring-orange-400/60",
    glow: "shadow-[0_0_28px_hsl(20_100%_55%/0.5)]",
    border: "border-orange-400/60",
  },
  genesis: {
    label: "Genesis",
    icon: "✺",
    chip: "from-cyan-400 via-fuchsia-500 to-pink-500",
    ring: "ring-fuchsia-400/60",
    glow: "shadow-[0_0_36px_hsl(330_100%_55%/0.5),0_0_60px_hsl(191_100%_50%/0.3)]",
    border: "border-fuchsia-400/60",
  },
  grail: {
    label: "Grail",
    icon: "♛",
    chip: "from-yellow-300 via-amber-400 to-yellow-600",
    ring: "ring-amber-300/70",
    glow: "shadow-[0_0_40px_hsl(45_100%_55%/0.55),0_0_70px_hsl(330_100%_55%/0.25)]",
    border: "border-amber-300/70",
  },
};

// ---------- Official Groovium OpenSea collection ----------
const OPENSEA_URL = "https://opensea.io/collection/groovium";

const FEATURED_OFFICIAL = {
  name: "Groovium Genesis #001",
  collection: "Official Groovium Collection",
  image: grooviumOfficialNft,
  rarity: "genesis" as Rarity,
  priceEth: 1.0,
  priceUsd: 2126.99,
  endsInDays: 152,
  supply: "1 / 1",
  owner: "groovium.eth",
};

const OFFICIAL_NFTS = [
  {
    name: "Groovium Genesis",
    collection: "Official Groovium",
    image: grooviumOfficialNft,
    rarity: "genesis" as Rarity,
    priceEth: 0.85,
    priceUsd: 1807.94,
    supply: "1 / 25",
  },
  {
    name: "Sound Wave Pass",
    collection: "Official Groovium",
    image: grooviumOfficialNft,
    rarity: "legendary" as Rarity,
    priceEth: 0.42,
    priceUsd: 893.34,
    supply: "12 / 100",
  },
  {
    name: "Neon Holographic",
    collection: "Official Groovium",
    image: grooviumOfficialNft,
    rarity: "epic" as Rarity,
    priceEth: 0.18,
    priceUsd: 382.86,
    supply: "47 / 250",
  },
  {
    name: "Backstage Token",
    collection: "Official Groovium",
    image: grooviumOfficialNft,
    rarity: "rare" as Rarity,
    priceEth: 0.06,
    priceUsd: 127.62,
    supply: "180 / 1000",
  },
];

// ---------- Simulated community NFTs ----------
type CommunityNft = {
  id: string;
  name: string;
  artist: string;
  image: string;
  rarity: Rarity;
  priceGrv: number;
  supply: string;
  trending?: number; // % growth
};

const COMMUNITY_NFTS: CommunityNft[] = [
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    artist: "Ana Wave",
    image: nftNeonPulse,
    rarity: "common",
    priceGrv: 50,
    supply: "850 / 1000",
  },
  {
    id: "wave-access",
    name: "Wave Access",
    artist: "Lucas Neon",
    image: nftWaveAccess,
    rarity: "rare",
    priceGrv: 500,
    supply: "210 / 500",
    trending: 84,
  },
  {
    id: "cyber-frequency",
    name: "Cyber Frequency",
    artist: "CyberMike",
    image: nftCyberFrequency,
    rarity: "epic",
    priceGrv: 2000,
    supply: "62 / 200",
    trending: 142,
  },
  {
    id: "genesis-aura",
    name: "Genesis Aura",
    artist: "Mara Synth",
    image: nftGenesisAura,
    rarity: "legendary",
    priceGrv: 12000,
    supply: "9 / 50",
    trending: 230,
  },
  {
    id: "eternal-groove",
    name: "Eternal Groove",
    artist: "Sasha Orbit",
    image: nftEternalGroove,
    rarity: "genesis",
    priceGrv: 50000,
    supply: "2 / 10",
    trending: 312,
  },
  {
    id: "quantum-sound",
    name: "Quantum Sound Genesis",
    artist: "DJ Helix",
    image: nftQuantumSound,
    rarity: "genesis",
    priceGrv: 120000,
    supply: "1 / 3",
    trending: 480,
  },
];

const GRAILS: CommunityNft[] = [
  {
    id: "genesis-prime",
    name: "Genesis Prime",
    artist: "Groovium Lab",
    image: nftGenesisPrime,
    rarity: "grail",
    priceGrv: 250000,
    supply: "1 / 1",
  },
  {
    id: "eternal-founder",
    name: "Eternal Founder",
    artist: "Groovium Lab",
    image: nftEternalFounder,
    rarity: "grail",
    priceGrv: 500000,
    supply: "1 / 1",
  },
  {
    id: "first-wave",
    name: "First Wave Artifact",
    artist: "Groovium Lab",
    image: nftFirstWave,
    rarity: "grail",
    priceGrv: 1_200_000,
    supply: "1 / 1",
  },
];

type ArtistNft = CommunityNft & { genre: string };

const ARTIST_NFTS: ArtistNft[] = [
  {
    id: "artist-neon-frequency",
    name: "Neon Frequency",
    artist: "Synthwave Collective",
    image: nftArtistNeonFrequency,
    rarity: "rare",
    priceGrv: 750,
    supply: "120 / 300",
    genre: "Synthwave",
  },
  {
    id: "artist-luna-vox",
    name: "Luna Vox",
    artist: "Luna Vox",
    image: nftArtistLunaVox,
    rarity: "epic",
    priceGrv: 3200,
    supply: "40 / 150",
    genre: "Dream Pop Futurista",
  },
  {
    id: "artist-cybergroove",
    name: "CyberGroove",
    artist: "CyberGroove",
    image: nftArtistCyberGroove,
    rarity: "legendary",
    priceGrv: 9800,
    supply: "12 / 60",
    genre: "Street Cyberpunk",
  },
];



const ACTIVITY_SEED = [
  "Lucas Neon comprou Genesis Aura por 12.000 GRVM",
  "Ana Wave vendeu Neon Pulse por 80 GRVM",
  "CyberMike encontrou uma NFT lendária 🔥",
  "DJ Helix listou Quantum Sound Genesis por 120.000 GRVM",
  "Sasha Orbit recebeu uma oferta de 60.000 GRVM",
  "Mara Synth mintou Wave Access ⚡",
  "Groovium Lab revelou um novo grail 💎",
];

const formatGrv = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;

// ---------- Components ----------

function RarityChip({ rarity }: { rarity: Rarity }) {
  const r = RARITY[rarity];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r ${r.chip} text-white font-bold shadow-md`}
    >
      <span>{r.icon}</span> {r.label}
    </span>
  );
}

function FeaturedOfficial() {
  const r = RARITY[FEATURED_OFFICIAL.rarity];
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border ${r.border} ${r.glow} glass-card p-6 md:p-8`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="relative grid md:grid-cols-2 gap-6 items-center">
        <div className={`relative aspect-square rounded-2xl overflow-hidden ring-2 ${r.ring}`}>
          <img
            src={FEATURED_OFFICIAL.image}
            alt={FEATURED_OFFICIAL.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur text-[10px] font-display uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3 text-primary" /> Verified
          </div>
          <div className="absolute top-3 right-3">
            <RarityChip rarity={FEATURED_OFFICIAL.rarity} />
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur text-[10px] font-display uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-accent" /> Official Web3 Collection
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground font-display uppercase tracking-widest">
              {FEATURED_OFFICIAL.collection}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-black gradient-neon-text mt-1">
              {FEATURED_OFFICIAL.name}
            </h2>
            <div className="text-xs text-muted-foreground mt-1">
              Owner: <span className="text-foreground">{FEATURED_OFFICIAL.owner}</span> · Supply{" "}
              {FEATURED_OFFICIAL.supply}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/40 p-3 bg-background/40">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Price</div>
              <div className="font-display text-2xl font-black text-primary">
                {FEATURED_OFFICIAL.priceEth.toFixed(2)} ETH
              </div>
              <div className="text-xs text-muted-foreground">
                ≈ ${FEATURED_OFFICIAL.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-xl border border-border/40 p-3 bg-background/40">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" /> Auction
              </div>
              <div className="font-display text-2xl font-black text-accent">
                Ending in {Math.round(FEATURED_OFFICIAL.endsInDays / 30)} months
              </div>
              <div className="text-xs text-muted-foreground">Ends ~{FEATURED_OFFICIAL.endsInDays} days</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={OPENSEA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-display font-bold text-sm hover:scale-105 transition-transform"
            >
              Comprar no OpenSea <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={OPENSEA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm hover:bg-primary/10 transition-colors"
            >
              Ver Coleção
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function OfficialCard({ nft }: { nft: typeof OFFICIAL_NFTS[number] }) {
  const r = RARITY[nft.rarity];
  return (
    <a
      href={OPENSEA_URL}
      target="_blank"
      rel="noreferrer"
      className={`group relative rounded-2xl overflow-hidden border ${r.border} ${r.glow} glass-card hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur text-[9px] font-display uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3 text-primary" /> Verified
        </div>
        <div className="absolute top-2 right-2">
          <RarityChip rarity={nft.rarity} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3 space-y-1">
        <div className="font-display font-bold text-sm truncate">{nft.name}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{nft.collection}</div>
        <div className="text-[10px] text-muted-foreground">Supply {nft.supply}</div>
        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="font-display font-black text-primary text-sm">{nft.priceEth} ETH</div>
            <div className="text-[10px] text-muted-foreground">
              ${nft.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <span className="text-[10px] font-display uppercase tracking-widest text-accent inline-flex items-center gap-1">
            OpenSea <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

function CommunityCard({ nft }: { nft: CommunityNft }) {
  const r = RARITY[nft.rarity];
  const { open: openMarketplace } = useMarketplaceModal();
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border ${r.border} ${r.glow} glass-card hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-2 right-2">
          <RarityChip rarity={nft.rarity} />
        </div>
        {nft.trending && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/90 text-accent-foreground text-[9px] font-display uppercase tracking-widest font-bold">
            <TrendingUp className="w-3 h-3" /> +{nft.trending}%
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="font-display font-bold text-sm truncate">{nft.name}</div>
        <div className="text-[10px] text-muted-foreground truncate">por {nft.artist}</div>
        <div className="text-[10px] text-muted-foreground">Supply {nft.supply}</div>
        <div className="flex items-end justify-between pt-1">
          <div className="font-display font-black text-primary text-sm">{formatGrv(nft.priceGrv)} GRVM</div>
          <Button
            size="sm"
            onClick={openMarketplace}
            className="h-7 px-2 text-[10px] bg-gradient-to-r from-primary to-accent text-background font-bold"
          >
            Comprar
          </Button>
        </div>
      </div>
    </div>
  );
}

function GrailCard({ nft }: { nft: CommunityNft }) {
  const r = RARITY[nft.rarity];
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border ${r.border} ${r.glow} glass-card`}
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <RarityChip rarity={nft.rarity} />
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/90 text-accent-foreground text-[9px] font-display uppercase tracking-widest font-bold">
          <Crown className="w-3 h-3" /> Grail
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
          <div className="font-display text-xl font-black gradient-neon-text">{nft.name}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{nft.artist}</div>
          <div className="flex items-end justify-between pt-2">
            <div className="font-display font-black text-accent text-2xl">{formatGrv(nft.priceGrv)} GRVM</div>
            <div className="text-[10px] text-muted-foreground">Supply {nft.supply}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveActivity() {
  const [items, setItems] = useState<string[]>(ACTIVITY_SEED.slice(0, 5));
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => {
        const next = ACTIVITY_SEED[Math.floor(Math.random() * ACTIVITY_SEED.length)];
        return [next, ...prev].slice(0, 6);
      });
    }, 4500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="glass-card rounded-2xl p-4 border border-accent/30 box-glow-magenta">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-accent" />
        <div className="font-display text-sm font-bold">Live NFT Activity</div>
        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> ao vivo
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li
            key={t + i}
            className="text-xs text-muted-foreground border-l-2 border-accent/40 pl-2 animate-fade-in"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarketStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Floor Price", value: "50 GRVM", icon: "💠" },
        { label: "Volume 24h", value: "284k GRVM", icon: "📈" },
        { label: "Holders", value: "1.842", icon: "👥" },
        { label: "Total Supply", value: "12.500", icon: "🌐" },
      ].map((s) => (
        <div key={s.label} className="glass-card rounded-xl p-3 border border-border/40">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</div>
          <div className="font-display font-black text-lg gradient-neon-text">
            <span className="mr-1">{s.icon}</span>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioCard() {
  const { profile } = useAuth();
  const [owned, setOwned] = useState(0);
  useEffect(() => {
    if (!profile) return;
    supabase
      .from("item_claims")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .then(({ count }) => setOwned(count ?? 0));
  }, [profile?.user_id]);

  const estValue = owned * 1250;
  return (
    <div className="glass-card rounded-2xl p-4 border border-primary/30 box-glow-blue">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-4 h-4 text-primary" />
        <div className="font-display text-sm font-bold">✨ Portfolio Value</div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">NFTs</div>
          <div className="font-display text-xl font-black">{owned}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Est. Value</div>
          <div className="font-display text-xl font-black text-primary">{formatGrv(estValue)} GRVM</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Mais rara</div>
          <div className="font-display text-xl font-black text-accent">{owned > 0 ? "Epic" : "—"}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

const RARITY_FILTERS: (Rarity | "all")[] = ["all", "common", "rare", "epic", "legendary", "genesis"];
type SortKey = "recent" | "high" | "low" | "trending";

const NFTs = () => {
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    let list = [...COMMUNITY_NFTS];
    if (rarity !== "all") list = list.filter((n) => n.rarity === rarity);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.artist.toLowerCase().includes(q));
    }
    if (sort === "high") list.sort((a, b) => b.priceGrv - a.priceGrv);
    if (sort === "low") list.sort((a, b) => a.priceGrv - b.priceGrv);
    if (sort === "trending") list.sort((a, b) => (b.trending ?? 0) - (a.trending ?? 0));
    return list;
  }, [search, rarity, sort]);

  const trending = [...COMMUNITY_NFTS]
    .filter((n) => n.trending)
    .sort((a, b) => (b.trending ?? 0) - (a.trending ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-black gradient-neon-text flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-primary" /> NFT Marketplace
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-secondary/40 bg-secondary/10 text-[10px] font-display uppercase tracking-wider text-secondary">
              <svg viewBox="0 0 32 32" className="w-3 h-3"><defs><linearGradient id="sol-nft-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14F195" /><stop offset="100%" stopColor="#9945FF" /></linearGradient></defs><g fill="url(#sol-nft-g)"><path d="M6.5 21.5 9 19h17l-2.5 2.5H6.5zM6.5 13 9 10.5h17L23.5 13H6.5zM23.5 17.25 26 14.75H9l2.5 2.5h12z" /></g></svg>
              Future Solana NFTs
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Colete drops oficiais, raros e Genesis do ecossistema Groovium. As futuras NFTs serão migradas para a infraestrutura Solana.
          </p>
        </div>
        <MarketStats />
      </div>

      {/* AI + Portfolio */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AiSuggestion />
        </div>
        <PortfolioCard />
      </div>

      {/* Featured Official */}
      <FeaturedOfficial />

      {/* Official Collection grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl md:text-2xl font-black flex items-center gap-2">
            🌌 Official Groovium Collection
          </h2>
          <a
            href={OPENSEA_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-display uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver no OpenSea <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OFFICIAL_NFTS.map((n) => (
            <OfficialCard key={n.name} nft={n} />
          ))}
        </div>
      </section>

      {/* Two-column: Community + Activity */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display text-xl md:text-2xl font-black flex items-center gap-2">
              💿 NFTs da Comunidade
            </h2>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-3 border border-border/40 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar NFT ou artista..."
                  className="pl-9 bg-background/40"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-10 rounded-md border border-input bg-background/40 px-3 text-sm"
              >
                <option value="recent">Mais recentes</option>
                <option value="trending">Trending</option>
                <option value="high">Mais caras</option>
                <option value="low">Mais baratas</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {RARITY_FILTERS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRarity(r)}
                  className={`text-[10px] font-display uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                    rarity === r
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {r === "all" ? "Todas" : `${RARITY[r as Rarity].icon} ${RARITY[r as Rarity].label}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((n) => (
              <CommunityCard key={n.id} nft={n} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full glass-card rounded-2xl p-10 text-center text-muted-foreground border-dashed">
                Nenhuma NFT encontrada com esses filtros.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <LiveActivity />

          {/* Trending */}
          <div className="glass-card rounded-2xl p-4 border border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div className="font-display text-sm font-bold">🔥 Trending NFTs</div>
            </div>
            <ul className="space-y-3">
              {trending.map((n, i) => (
                <li key={n.id} className="flex items-center gap-3">
                  <span className="font-display font-black text-muted-foreground w-4">{i + 1}</span>
                  <img src={n.image} alt={n.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-display font-bold truncate">{n.name}</div>
                    <div className="text-[10px] text-muted-foreground">{formatGrv(n.priceGrv)} GRVM</div>
                  </div>
                  <span className="text-[10px] font-display font-bold text-accent">+{n.trending}%</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Grails */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-black flex items-center gap-2">
              💎 Grails Collection
            </h2>
            <p className="text-xs text-muted-foreground">
              Peças únicas, ultra raras, e marcos históricos do ecossistema.
            </p>
          </div>
          <span className="text-[10px] font-display uppercase tracking-widest text-accent inline-flex items-center gap-1">
            <Activity className="w-3 h-3" /> 1 of 1
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {GRAILS.map((n) => (
            <GrailCard key={n.id} nft={n} />
          ))}
        </div>
      </section>

      {/* User-created items from DB */}
      <section className="pt-2 border-t border-border/40">
        <ItemsGrid kind="nft" />
      </section>
    </div>
  );
};

export default NFTs;
