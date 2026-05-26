import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Image as ImageIcon, Ticket } from "lucide-react";

const NewItem = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [kind, setKind] = useState<"nft" | "experience">("nft");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [paid, setPaid] = useState(false);
  const [priceGrv, setPriceGrv] = useState(50);
  const [supply, setSupply] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  if (profile && profile.profile_type !== "musician") {
    navigate("/app/studio", { replace: true });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Dê um título ao drop");
    setSubmitting(true);
    const { data, error } = await supabase.rpc("create_artist_item", {
      _kind: kind,
      _title: title.trim(),
      _description: description.trim() || null,
      _image_url: imageUrl.trim() || null,
      _price_grv: paid ? Math.max(0, Math.floor(priceGrv)) : 0,
      _supply: Math.max(1, Math.floor(supply)),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("🚀 Drop publicado!");
    navigate("/app/studio");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>

      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">Novo drop</h1>
        <p className="text-muted-foreground text-sm mt-1">Publique um NFT ou experiência exclusiva.</p>
      </div>

      <form onSubmit={submit} className="space-y-5 glass-card rounded-2xl p-6 border border-border/40">
        <div>
          <Label className="mb-2 block">Tipo</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["nft", "experience"] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setKind(k)}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  kind === k ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40"
                }`}
              >
                {k === "nft" ? <ImageIcon className="w-5 h-5 text-primary" /> : <Ticket className="w-5 h-5 text-accent" />}
                <div className="text-left">
                  <div className="font-display font-bold text-sm">{k === "nft" ? "NFT" : "Experiência"}</div>
                  <div className="text-xs text-muted-foreground">
                    {k === "nft" ? "Ativo digital colecionável" : "Acesso ou evento exclusivo"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ex: Backstage Pass — Tour 2026" />
        </div>

        <div>
          <Label htmlFor="desc">Descrição</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="Conte ao seu fã o que ele vai receber..." />
        </div>

        <div>
          <Label htmlFor="img">URL da imagem (opcional)</Label>
          <Input id="img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/40">
          <div>
            <div className="font-display font-bold text-sm">Pago em GRVM</div>
            <div className="text-xs text-muted-foreground">Desligado = drop gratuito (claim)</div>
          </div>
          <Switch checked={paid} onCheckedChange={setPaid} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {paid && (
            <div>
              <Label htmlFor="price">Preço (GRVM)</Label>
              <Input id="price" type="number" min={1} value={priceGrv} onChange={(e) => setPriceGrv(Number(e.target.value))} />
            </div>
          )}
          <div className={paid ? "" : "col-span-2"}>
            <Label htmlFor="supply">Quantidade total</Label>
            <Input id="supply" type="number" min={1} value={supply} onChange={(e) => setSupply(Number(e.target.value))} />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-primary to-accent text-background font-display font-bold">
          {submitting ? "Publicando..." : "🚀 Publicar drop"}
        </Button>
      </form>
    </div>
  );
};

export default NewItem;
