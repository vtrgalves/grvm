import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, Plus, Image as ImageIcon, Ticket, TrendingUp, Users } from "lucide-react";

interface Item {
  id: string;
  kind: "nft" | "experience";
  title: string;
  price_grv: number;
  supply: number;
  claimed_count: number;
  active: boolean;
}

const Studio = () => {
  const { profile, refreshProfile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const isArtist = profile?.profile_type === "musician";

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("artist_items")
      .select("id,kind,title,price_grv,supply,claimed_count,active")
      .eq("artist_id", profile.user_id)
      .order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isArtist) load();
    else setLoading(false);
  }, [profile?.user_id, isArtist]);

  const becomeArtist = async () => {
    const { error } = await supabase.rpc("become_artist");
    if (error) return toast.error(error.message);
    toast.success("🎤 Você agora é um artista Groovium!");
    await refreshProfile();
  };

  if (!isArtist) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Mic className="w-10 h-10 text-background" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold gradient-neon-text">
          Torne-se artista Groovium
        </h1>
        <p className="text-muted-foreground">
          Publique NFTs e experiências exclusivas. Fãs pagam em GRV e você recebe direto no seu saldo, sem intermediários.
        </p>
        <ul className="text-sm text-left max-w-md mx-auto space-y-2 text-muted-foreground">
          <li>✨ Crie drops em segundos (gratuitos ou pagos em GRV)</li>
          <li>💎 Receba 90% de cada venda direto no saldo</li>
          <li>🎧 Conecte-se com sua base de fãs em tempo real</li>
        </ul>
        <Button onClick={becomeArtist} size="lg" className="bg-gradient-to-r from-primary to-accent text-background font-display font-bold">
          Ativar perfil de artista
        </Button>
      </div>
    );
  }

  const totalClaims = items.reduce((s, i) => s + i.claimed_count, 0);
  const totalRevenue = items.reduce((s, i) => s + i.claimed_count * i.price_grv, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
            <Mic className="w-6 h-6 text-accent" /> Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus drops e acompanhe sua audiência.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-accent text-background font-display font-bold">
          <Link to="/app/studio/new"><Plus className="w-4 h-4 mr-1" /> Novo drop</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-primary/30">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Drops ativos</div>
          <div className="font-display text-3xl font-bold text-primary mt-1">{items.filter(i => i.active).length}</div>
          <ImageIcon className="w-5 h-5 text-primary/60 mt-2" />
        </div>
        <div className="glass-card rounded-2xl p-5 border border-accent/30">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Reivindicações</div>
          <div className="font-display text-3xl font-bold text-accent mt-1">{totalClaims}</div>
          <Users className="w-5 h-5 text-accent/60 mt-2" />
        </div>
        <div className="glass-card rounded-2xl p-5 border border-secondary/30">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Faturado (GRV)</div>
          <div className="font-display text-3xl font-bold text-secondary mt-1">{totalRevenue.toLocaleString("pt-BR")}</div>
          <TrendingUp className="w-5 h-5 text-secondary/60 mt-2" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">Seus drops</h2>
        {loading ? (
          <div className="text-muted-foreground text-sm">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground border-dashed">
            Você ainda não publicou nenhum drop. Comece criando seu primeiro NFT ou experiência.
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((it) => (
              <div key={it.id} className="glass-card rounded-xl p-4 flex items-center gap-4 border border-border/40">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${it.kind === "nft" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  {it.kind === "nft" ? <ImageIcon className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold truncate">{it.title}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    {it.kind === "nft" ? "NFT" : "Experiência"} · {it.claimed_count}/{it.supply} reivindicados
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-primary text-sm">
                    {it.price_grv > 0 ? `${it.price_grv} GRV` : "Grátis"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Studio;
