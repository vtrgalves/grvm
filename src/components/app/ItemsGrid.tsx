import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Image as ImageIcon, Ticket, Check, Lock } from "lucide-react";

interface Item {
  id: string;
  artist_id: string;
  kind: "nft" | "experience";
  title: string;
  description: string | null;
  image_url: string | null;
  price_grv: number;
  supply: number;
  claimed_count: number;
  active: boolean;
}

interface Props { kind: "nft" | "experience"; }

export default function ItemsGrid({ kind }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [artists, setArtists] = useState<Record<string, string>>({});
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: its } = await supabase
      .from("artist_items")
      .select("*")
      .eq("kind", kind)
      .eq("active", true)
      .order("created_at", { ascending: false });
    const list = (its as Item[]) ?? [];
    setItems(list);

    const ids = Array.from(new Set(list.map((i) => i.artist_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,name")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p.name; });
      setArtists(map);
    }

    if (profile) {
      const { data: cl } = await supabase
        .from("item_claims")
        .select("item_id")
        .eq("user_id", profile.user_id);
      setClaimed(new Set((cl ?? []).map((c: any) => c.item_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [kind, profile?.user_id]);

  const claim = async (item: Item) => {
    setBusy(item.id);
    const { data, error } = await supabase.rpc("claim_artist_item", { _item_id: item.id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(item.price_grv > 0 ? `🎉 Adquirido por ${item.price_grv} GRV!` : "✨ Reivindicado!");
    await refreshProfile();
    await load();
  };

  const Icon = kind === "nft" ? ImageIcon : Ticket;
  const title = kind === "nft" ? "NFTs" : "Experiências";
  const subtitle = kind === "nft" ? "Colecione drops digitais dos seus artistas favoritos." : "Acesse encontros, shows e bastidores exclusivos.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
          <Icon className="w-6 h-6 text-secondary" /> {title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground border-dashed">
          Nenhum drop disponível ainda. Volte em breve. ✨
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it) => {
            const owned = claimed.has(it.id);
            const soldOut = it.claimed_count >= it.supply;
            const isOwn = profile?.user_id === it.artist_id;
            const insufficient = profile ? profile.grv_points < it.price_grv : true;
            return (
              <div key={it.id} className="glass-card rounded-2xl p-4 border border-border/40 flex flex-col">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center mb-3 overflow-hidden">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-12 h-12 text-primary/60" />
                  )}
                </div>
                <div className="font-display font-bold truncate">{it.title}</div>
                <div className="text-xs text-muted-foreground mb-1">por {artists[it.artist_id] ?? "Artista"}</div>
                {it.description && (
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{it.description}</div>
                )}
                <div className="text-xs text-muted-foreground mb-3">
                  {it.claimed_count}/{it.supply} reivindicados
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="font-display font-bold text-primary">
                    {it.price_grv > 0 ? `${it.price_grv} GRV` : "Grátis"}
                  </div>
                  {owned ? (
                    <Button size="sm" disabled variant="secondary"><Check className="w-3 h-3 mr-1" /> Seu</Button>
                  ) : isOwn ? (
                    <Button size="sm" disabled variant="ghost">Seu drop</Button>
                  ) : soldOut ? (
                    <Button size="sm" disabled variant="ghost"><Lock className="w-3 h-3 mr-1" /> Esgotado</Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busy === it.id || (it.price_grv > 0 && insufficient)}
                      onClick={() => claim(it)}
                      className="bg-gradient-to-r from-primary to-accent text-background font-bold"
                    >
                      {busy === it.id ? "..." : it.price_grv > 0 ? (insufficient ? "GRV insuficiente" : "Comprar") : "Resgatar"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
