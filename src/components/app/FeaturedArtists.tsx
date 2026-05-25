import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mic, ArrowRight } from "lucide-react";

interface A { user_id: string; name: string; handle: string | null; bio: string | null; photo_url: string | null; grv_points: number; selected_genres: string[] | null; }

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<A[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("user_id,name,handle,bio,photo_url,grv_points,selected_genres")
      .eq("profile_type", "musician").order("grv_points", { ascending: false }).limit(3)
      .then(({ data }) => data && setArtists(data as A[]));
  }, []);
  if (!artists.length) return null;
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Mic className="w-4 h-4 text-accent" /> Artistas em destaque
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {artists.map((a) => (
          <Link
            key={a.user_id}
            to={a.handle ? `/u/${a.handle}` : "#"}
            className="group flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/40 hover:border-primary/50 transition-all hover-scale"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">
                {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm truncate">{a.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{a.selected_genres?.join(" · ") || "—"}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{a.bio?.replace(/^\[seed\]\s*/, "") || ""}</p>
            <span className="text-[10px] text-primary font-display uppercase tracking-widest inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver perfil <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
