import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Wand2, Mic, Ticket, Users, Copy, Loader2 } from "lucide-react";

type Action = "artist_bio" | "drop_concept" | "experience_suggestion" | "artists_to_follow";

async function callAI(action: Action, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("ai-groovium", {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.result;
}

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
}

function NeonCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-primary/30 bg-card/60 backdrop-blur p-4 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)] ${className}`}
    >
      {children}
    </div>
  );
}

function BioGenerator() {
  const [form, setForm] = useState({ stage_name: "", genre: "", influences: "", style: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onGen = async () => {
    if (!form.stage_name || !form.genre) {
      toast({ title: "Preencha nome e gênero", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await callAI("artist_bio", form);
      setResult(r);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Mic className="h-5 w-5 text-primary" /> Gerador de Bio
        </CardTitle>
        <CardDescription>Crie 3 versões de bio em segundos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Nome artístico</Label>
            <Input value={form.stage_name} onChange={(e) => setForm({ ...form, stage_name: e.target.value })} placeholder="DJ Neon" />
          </div>
          <div className="space-y-1">
            <Label>Gênero</Label>
            <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Hyperpop / Funk" />
          </div>
          <div className="space-y-1">
            <Label>Influências</Label>
            <Input value={form.influences} onChange={(e) => setForm({ ...form, influences: e.target.value })} placeholder="Anitta, Charli XCX" />
          </div>
          <div className="space-y-1">
            <Label>Estilo</Label>
            <Input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="Futurista, alta energia" />
          </div>
        </div>
        <Button onClick={onGen} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar Bios com IA"}
        </Button>

        {loading && <Skeleton className="h-32" />}
        {result && (
          <div className="space-y-3">
            {(["short", "professional", "web3"] as const).map((k) => (
              <NeonCard key={k}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="uppercase text-xs">
                    {k === "short" ? "Curta" : k === "professional" ? "Profissional" : "Web3"}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => copy(result[k])}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{result[k]}</p>
              </NeonCard>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DropGenerator() {
  const [form, setForm] = useState({ project: "", emotion: "", drop_type: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onGen = async () => {
    if (!form.project) {
      toast({ title: "Informe o nome do projeto", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await callAI("drop_concept", form));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Sparkles className="h-5 w-5 text-secondary" /> Conceito de Drop / NFT
        </CardTitle>
        <CardDescription>Nome, descrição e CTA gerados por IA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Projeto</Label>
            <Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="Aurora EP" />
          </div>
          <div className="space-y-1">
            <Label>Emoção</Label>
            <Input value={form.emotion} onChange={(e) => setForm({ ...form, emotion: e.target.value })} placeholder="Nostalgia neon" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Input value={form.drop_type} onChange={(e) => setForm({ ...form, drop_type: e.target.value })} placeholder="Capa, faixa, passe VIP..." />
          </div>
        </div>
        <Button onClick={onGen} disabled={loading} className="w-full" variant="default">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar conceito"}
        </Button>
        {loading && <Skeleton className="h-32" />}
        {result && (
          <NeonCard>
            <h3 className="font-display text-2xl gradient-neon-text mb-2">{result.name}</h3>
            <p className="text-sm mb-3 text-muted-foreground">{result.description}</p>
            <Badge className="bg-primary/20 text-primary border-primary/40">{result.cta}</Badge>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => copy(`${result.name}\n\n${result.description}\n\n${result.cta}`)}>
                <Copy className="h-3 w-3 mr-1" /> Copiar tudo
              </Button>
            </div>
          </NeonCard>
        )}
      </CardContent>
    </Card>
  );
}

function ExperienceSuggestion() {
  const [form, setForm] = useState({ artist_name: "", genre: "", vibe: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onGen = async () => {
    if (!form.artist_name) {
      toast({ title: "Informe o nome do artista", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await callAI("experience_suggestion", form));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Ticket className="h-5 w-5 text-accent" /> Sugestão de Experiência
        </CardTitle>
        <CardDescription>A IA inventa uma experiência única para seus fãs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Input placeholder="Nome do artista" value={form.artist_name} onChange={(e) => setForm({ ...form, artist_name: e.target.value })} />
          <Input placeholder="Gênero" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          <Input placeholder="Vibe (intimista, épica...)" value={form.vibe} onChange={(e) => setForm({ ...form, vibe: e.target.value })} />
        </div>
        <Button onClick={onGen} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Pensando..." : "Sugerir experiência"}
        </Button>
        {loading && <Skeleton className="h-28" />}
        {result && (
          <NeonCard>
            <Badge variant="outline" className="mb-2">{result.event_type}</Badge>
            <h3 className="font-display text-xl mb-2 gradient-neon-text">{result.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{result.description}</p>
            <div className="text-primary font-bold">≈ {result.estimated_grv} GRV</div>
          </NeonCard>
        )}
      </CardContent>
    </Card>
  );
}

function ArtistsToFollow() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onGen = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await callAI("artists_to_follow", {
        genres: profile?.selected_genres ?? [],
        city: profile?.city ?? "",
      });
      setResult(r);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Users className="h-5 w-5 text-primary" /> Artistas para você seguir
        </CardTitle>
        <CardDescription>
          Sugestões baseadas em {profile?.selected_genres?.length ? profile.selected_genres.join(", ") : "seu perfil"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onGen} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Buscando vibes..." : "Descobrir artistas com IA"}
        </Button>
        {loading && (
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        )}
        {result?.artists && (
          <div className="grid sm:grid-cols-2 gap-3">
            {result.artists.map((a: any, i: number) => (
              <NeonCard key={i}>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-display text-lg gradient-neon-text">{a.name}</h4>
                  <Badge variant="outline" className="text-xs">{a.vibe}</Badge>
                </div>
                <div className="text-xs text-primary mb-2">{a.genre}</div>
                <p className="text-sm text-muted-foreground">{a.reason}</p>
              </NeonCard>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AiGroovium() {
  const { profile } = useAuth();
  const isArtist = profile?.profile_type === "musician";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6">
        <div className="absolute inset-0 opacity-30 blur-3xl bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary))_0%,transparent_50%),radial-gradient(circle_at_80%_80%,hsl(var(--secondary))_0%,transparent_50%)]" />
        <div className="relative">
          <Badge className="mb-3 bg-primary/20 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-1" /> Powered by Lovable AI
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-neon-text mb-2">IA Groovium</h1>
          <p className="text-muted-foreground max-w-xl">
            Inteligência artificial pensada para o ecossistema musical. Crie bios, conceitos de drop, experiências e descubra novos artistas — tudo com um clique.
          </p>
        </div>
      </div>

      <Tabs defaultValue={isArtist ? "artists" : "fans"}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="artists">Para Artistas</TabsTrigger>
          <TabsTrigger value="fans">Para Fãs</TabsTrigger>
        </TabsList>
        <TabsContent value="artists" className="space-y-6 mt-6">
          <BioGenerator />
          <DropGenerator />
          <ExperienceSuggestion />
        </TabsContent>
        <TabsContent value="fans" className="space-y-6 mt-6">
          <ArtistsToFollow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
