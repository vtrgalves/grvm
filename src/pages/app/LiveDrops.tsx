import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Radio, Clock, Calendar, Image as ImageIcon, Ticket, Plus, CheckCircle2 } from "lucide-react";
import { marketplace_enabled } from "@/lib/marketplace";
import { useMarketplaceModal } from "@/components/app/MarketplaceComingSoonModal";

type Drop = {
  id: string;
  artist_id: string;
  artist_name: string;
  kind: "nft" | "experience";
  title: string;
  description: string | null;
  image_url: string | null;
  price_grv: number;
  supply: number;
  claimed_count: number;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "live" | "ended";
  claimed_by_me: boolean;
};

const useCountdown = (target: string) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, new Date(target).getTime() - now);
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const DropCard = ({ drop, onClaim, claiming }: { drop: Drop; onClaim: (id: string) => void; claiming: boolean }) => {
  const target = drop.status === "upcoming" ? drop.starts_at : drop.ends_at;
  const countdown = useCountdown(target);
  const sold = drop.claimed_count >= drop.supply;
  const pct = Math.min(100, Math.round((drop.claimed_count / drop.supply) * 100));

  const statusBadge =
    drop.status === "live" ? (
      <Badge className="bg-accent text-background font-bold animate-pulse">
        <Radio className="w-3 h-3 mr-1" /> AO VIVO
      </Badge>
    ) : drop.status === "upcoming" ? (
      <Badge variant="outline" className="border-primary/60 text-primary">
        <Calendar className="w-3 h-3 mr-1" /> Em breve
      </Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">Encerrado</Badge>
    );

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/40 hover:border-primary/40 transition-all">
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
        {drop.image_url ? (
          <img src={drop.image_url} alt={drop.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {drop.kind === "nft" ? <ImageIcon className="w-12 h-12 text-primary/60" /> : <Ticket className="w-12 h-12 text-accent/60" />}
          </div>
        )}
        <div className="absolute top-3 left-3">{statusBadge}</div>
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-background/70 backdrop-blur">
            {drop.kind === "nft" ? "NFT" : "Experiência"}
          </Badge>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-display font-bold text-lg leading-tight">{drop.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">por {drop.artist_name}</p>
        </div>
        {drop.description && <p className="text-sm text-muted-foreground line-clamp-2">{drop.description}</p>}

        <div className="flex items-center gap-2 text-sm font-mono">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">
            {drop.status === "upcoming" ? "Inicia em" : drop.status === "live" ? "Termina em" : "Encerrado"}
          </span>
          {drop.status !== "ended" && <span className="font-bold text-accent">{countdown}</span>}
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{drop.claimed_count} / {drop.supply} resgatados</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="font-display font-bold">
            {drop.price_grv > 0 ? <span className="gradient-neon-text">{drop.price_grv} GRVM</span> : <span className="text-accent">GRÁTIS</span>}
          </div>
          {drop.claimed_by_me ? (
            <Button size="sm" disabled variant="outline">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Resgatado
            </Button>
          ) : sold ? (
            <Button size="sm" disabled variant="outline">Esgotado</Button>
          ) : drop.status === "live" ? (
            <Button size="sm" onClick={() => onClaim(drop.id)} disabled={claiming}
              className="bg-gradient-to-r from-primary to-accent text-background font-bold">
              {drop.price_grv > 0 ? "Comprar" : "Resgatar"}
            </Button>
          ) : drop.status === "upcoming" ? (
            <Button size="sm" disabled variant="outline">Aguardando</Button>
          ) : (
            <Button size="sm" disabled variant="outline">Encerrado</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function LiveDrops() {
  const { profile } = useAuth();
  const { open: openMarketplace } = useMarketplaceModal();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_live_drops");
    if (error) toast.error(error.message);
    else setDrops((data ?? []) as Drop[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("live_drops")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_drops" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_drop_claims" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const claim = async (id: string) => {
    if (!marketplace_enabled) {
      openMarketplace();
      return;
    }
    setClaiming(id);
    const { error } = await supabase.rpc("claim_live_drop", { _drop_id: id });
    setClaiming(null);
    if (error) return toast.error(error.message);
    toast.success("🎉 Drop resgatado!");
    load();
  };

  const live = useMemo(() => drops.filter((d) => d.status === "live"), [drops]);
  const upcoming = useMemo(() => drops.filter((d) => d.status === "upcoming"), [drops]);
  const ended = useMemo(() => drops.filter((d) => d.status === "ended"), [drops]);

  const isArtist = profile?.profile_type === "musician";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-neon-text">Drops ao Vivo</h1>
          <p className="text-muted-foreground mt-1">Eventos exclusivos com janela de tempo. Não perca!</p>
        </div>
        {isArtist && (
          <Link to="/app/studio/new-drop">
            <Button className="bg-gradient-to-r from-primary to-accent text-background font-bold">
              <Plus className="w-4 h-4 mr-1" /> Criar drop
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Carregando...</div>
      ) : drops.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-border/40">
          <Radio className="w-12 h-12 mx-auto text-primary/60 mb-3" />
          <p className="font-display text-lg">Nenhum drop ativo no momento</p>
          <p className="text-sm text-muted-foreground mt-1">Volte em breve — novos drops chegam toda semana.</p>
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-accent animate-pulse" /> Acontecendo agora
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {live.map((d) => <DropCard key={d.id} drop={d} onClaim={claim} claiming={claiming === d.id} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Próximos
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map((d) => <DropCard key={d.id} drop={d} onClaim={claim} claiming={claiming === d.id} />)}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold mb-4 text-muted-foreground">Encerrados</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
                {ended.map((d) => <DropCard key={d.id} drop={d} onClaim={claim} claiming={false} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
