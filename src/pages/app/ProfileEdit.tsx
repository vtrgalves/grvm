import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function ProfileEdit() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setHandle((profile as any).handle ?? "");
      setBio((profile as any).bio ?? "");
      setCity(profile.city ?? "");
      setPhotoUrl(profile.photo_url ?? "");
    }
  }, [profile]);

  const sanitizeHandle = (v: string) =>
    v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (handle.length < 3) return toast.error("Handle precisa ter ao menos 3 caracteres");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim(), handle, bio: bio.trim() || null,
      city: city.trim() || null, photo_url: photoUrl.trim() || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast.error("Esse @handle já está em uso");
      return toast.error(error.message);
    }
    toast.success("Perfil atualizado!");
    refreshProfile?.();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">Editar perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize sua presença no Groovium.</p>
        </div>
        {handle && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/u/${handle}`)}>
            <ExternalLink className="w-4 h-4 mr-1" /> Ver perfil
          </Button>
        )}
      </div>

      <form onSubmit={save} className="space-y-4 glass-card rounded-2xl p-6 border border-border/40">
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
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} rows={3} placeholder="Conte quem você é..." />
          <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={50} />
        </div>
        <div>
          <Label htmlFor="photo">URL da foto</Label>
          <Input id="photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-accent text-background font-display font-bold">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
