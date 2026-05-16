import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, UserMinus, MapPin, Trophy, Sparkles, Image as ImageIcon, Ticket, ArrowLeft, Mic } from "lucide-react";
import TipDialog from "@/components/app/TipDialog";

interface PublicProfile {
  user_id: string; handle: string; name: string;
  bio: string | null; photo_url: string | null;
  level: string; grv_points: number;
  profile_type: "fan" | "musician";
  city: string | null; created_at: string;
  followers: number; following: number;
  is_following: boolean; is_self: boolean;
  items: Array<{ id: string; kind: "nft" | "experience"; title: string; image_url: string | null; price_grv: number; supply: number; claimed_count: number }>;
}

interface UserBadge {
  id: string; slug: string; title: string; description: string; icon: string;
  rarity: "common" | "rare" | "epic" | "legendary"; burned_grv: number;
}

export default function PublicProfile() {
  const { handle } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!handle) return;
    const { data, error } = await supabase.rpc("get_public_profile", { _handle: handle });
    if (error) toast.error(error.message);
    const p = data as unknown as PublicProfile | null;
    setProfile(p);
    if (p?.user_id) {
      const { data: bd } = await supabase.rpc("get_user_badges", { _user_id: p.user_id });
      setBadges((bd as UserBadge[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [handle]);

  const toggleFollow = async () => {
    if (!user) { toast.error("Faça login para seguir"); return; }
    if (!profile) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("toggle_follow", { _target: profile.user_id });
    setBusy(false);
    if (error) return toast.error(error.message);
    const following = (data as any)?.following;
    setProfile({
      ...profile,
      is_following: following,
      followers: profile.followers + (following ? 1 : -1),
    });
    if (following && profile.profile_type === "musician") toast.success("+5 GRV", { description: "Novo artista seguido!" });
  };

  if (loading) return <div className="text-center text-muted-foreground py-20">Carregando...</div>;
  if (!profile) return (
    <div className="text-center py-20 space-y-3">
      <p className="font-display text-xl">Perfil não encontrado</p>
      <Link to="/app"><Button variant="outline">Voltar</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/feed"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Feed</Button></Link>

      <div className="glass-card rounded-2xl p-6 border border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-3xl text-background flex-shrink-0">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full rounded-full object-cover" />
            ) : profile.name[0]?.toUpperCase()}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {profile.name}
                  {profile.profile_type === "musician" && (
                    <Badge className="bg-accent text-background"><Mic className="w-3 h-3 mr-1" /> Artista</Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.handle}</p>
              </div>
              {!profile.is_self && (
                <div className="flex gap-2">
                  <TipDialog toUserId={profile.user_id} toName={profile.name} />
                  <Button onClick={toggleFollow} disabled={busy}
                    variant={profile.is_following ? "outline" : "default"}
                    className={profile.is_following ? "" : "bg-gradient-to-r from-primary to-accent text-background font-bold"}>
                    {profile.is_following
                      ? <><UserMinus className="w-4 h-4 mr-1" /> Seguindo</>
                      : <><UserPlus className="w-4 h-4 mr-1" /> Seguir</>}
                  </Button>
                </div>
              )}
            </div>

            {profile.bio && <p className="text-sm">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1 text-accent"><Trophy className="w-4 h-4" /> {profile.level}</span>
              <span className="flex items-center gap-1 gradient-neon-text font-bold"><Sparkles className="w-4 h-4" /> {profile.grv_points} GRV</span>
              {profile.city && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-4 h-4" /> {profile.city}</span>}
            </div>

            <div className="flex gap-6 pt-2 border-t border-border/40">
              <div><span className="font-display font-bold text-lg">{profile.followers}</span> <span className="text-xs text-muted-foreground">seguidores</span></div>
              <div><span className="font-display font-bold text-lg">{profile.following}</span> <span className="text-xs text-muted-foreground">seguindo</span></div>
            </div>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Conquistas</h2>
          <div className="flex flex-wrap gap-3">
            {badges.map(b => (
              <div key={b.id} title={`${b.title} — ${b.description} (${b.burned_grv} GRV queimados)`}
                className="glass-card border border-border/40 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="font-display font-bold text-sm">{b.title}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{b.rarity}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.profile_type === "musician" && (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Drops do artista</h2>
          {profile.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum drop publicado ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.items.map(it => (
                <div key={it.id} className="glass-card rounded-xl overflow-hidden border border-border/40">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    {it.image_url ? <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" />
                      : it.kind === "nft" ? <ImageIcon className="w-10 h-10 text-primary/60" /> : <Ticket className="w-10 h-10 text-accent/60" />}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-display font-bold text-sm truncate">{it.title}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{it.claimed_count}/{it.supply}</span>
                      <span className="font-bold gradient-neon-text">{it.price_grv > 0 ? `${it.price_grv} GRV` : "GRÁTIS"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
