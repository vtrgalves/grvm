import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Ticket } from "lucide-react";

interface I { id: string; kind: string; title: string; image_url: string | null; price_grv: number; supply: number; claimed_count: number; }

export default function FeaturedItems({ kind, title, to }: { kind: "nft" | "experience"; title: string; to: string }) {
  const [items, setItems] = useState<I[]>([]);
  useEffect(() => {
    supabase.from("artist_items").select("id,kind,title,image_url,price_grv,supply,claimed_count")
      .eq("kind", kind).eq("active", true).order("claimed_count", { ascending: false }).limit(3)
      .then(({ data }) => data && setItems(data as I[]));
  }, [kind]);
  const Icon = kind === "nft" ? ImageIcon : Ticket;
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Icon className="w-4 h-4 text-secondary" /> {title}
        </h2>
        <Link to={to} className="text-xs text-primary hover:underline">Ver todos</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((i) => (
          <Link key={i.id} to={to} className="group rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover-scale">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
              {i.image_url
                ? <img src={i.image_url} alt={i.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                : <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>}
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-background/95 to-transparent">
                <div className="text-[10px] font-display font-bold truncate">{i.title}</div>
                <div className="text-[10px] text-primary">{i.price_grv} GRV</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
