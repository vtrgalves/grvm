import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const GENRES = ["Lo-fi", "Trap", "Synthwave", "Indie", "EDM", "Funk", "Rock", "Pop", "Hip-Hop", "Jazz", "House", "Techno"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function EditProfileModal({ open, onOpenChange }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setName(profile.name ?? "");
      setHandle((profile as any).handle ?? "");
      setBio((profile as any).bio ?? "");
      setCity(profile.city ?? "");
      setPhotoUrl(profile.photo_url ?? "");
      setGenres(profile.selected_genres ?? []);
    }
  }, [profile, open]);

  const sanitizeHandle = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);

  const toggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 5 ? [...prev, g] : prev));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (handle.length < 3) return toast.error("Handle precisa ter ao menos 3 caracteres");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        handle,
        bio: bio.trim() || null,
        city: city.trim() || null,
        photo_url: photoUrl.trim() || null,
        selected_genres: genres.length ? genres : null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast.error("Esse @handle já está em uso");
      return toast.error(error.message);
    }
    toast.success("⚡ Perfil sincronizado!");
    refreshProfile?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-card border-primary/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl gradient-neon-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Editar identidade
          </DialogTitle>
          <DialogDescription>Sua presença no ecossistema Groovium.</DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="space-y-4">
          {/* Preview live */}
          <div className="rounded-xl border border-primary/20 bg-background/40 p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-accent p-[2px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-lg">{(name[0] ?? "G").toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold truncate">{name || "Seu nome"}</p>
              <p className="text-xs text-primary truncate">@{handle || "handle"}</p>
              {bio && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{bio}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </div>
          <div>
            <Label htmlFor="handle">@handle</Label>
            <Input id="handle" value={handle} onChange={(e) => setHandle(sanitizeHandle(e.target.value))} placeholder="seu_nome" />
            <p className="text-xs text-muted-foreground mt-1">groovium.app/u/{handle || "..."}</p>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="DJ e produtor de Lo-fi. Transformando frequência em conexão. 🎧⚡"
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
          </div>
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={50} placeholder="São Paulo, BR" />
          </div>
          <div>
            <Label htmlFor="photo">URL da foto</Label>
            <Input id="photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label>Gêneros favoritos <span className="text-muted-foreground text-xs">(até 5)</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GENRES.map((g) => {
                const active = genres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_12px_hsl(191_100%_50%/0.4)]"
                        : "bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-accent text-background font-display font-bold animate-pulse-glow"
          >
            {saving ? "Sincronizando..." : "⚡ Salvar identidade"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
