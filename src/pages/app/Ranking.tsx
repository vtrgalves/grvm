import { useEffect, useState } from "react";
import { Trophy, Crown, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface RankRow {
  user_id: string;
  name: string;
  level: string;
  photo_url: string | null;
  grv_points: number;
  profile_type: "fan" | "musician";
}

const podiumIcon = (pos: number) => {
  if (pos === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (pos === 1) return <Medal className="w-5 h-5 text-slate-300" />;
  if (pos === 2) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-display text-muted-foreground w-5 text-center">{pos + 1}</span>;
};

const Ranking = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "fan" | "musician">("all");
  const [rows, setRows] = useState<RankRow[]>([]);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("profiles")
        .select("user_id, name, level, photo_url, grv_points, profile_type")
        .order("grv_points", { ascending: false })
        .limit(100);
      if (filter !== "all") q = q.eq("profile_type", filter);
      const { data } = await q;
      setRows((data ?? []) as RankRow[]);
    })();
  }, [filter]);

  const myPos = user ? rows.findIndex(r => r.user_id === user.id) : -1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
          <Trophy className="w-7 h-7 text-primary" /> Top GRVM Artists
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Os fãs e artistas que mais movimentam a frequência.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="fan">Fãs</TabsTrigger>
          <TabsTrigger value="musician">Artistas</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-2">
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Nenhum participante ainda.</p>
          )}
          {rows.map((r, i) => {
            const isMe = user && r.user_id === user.id;
            return (
              <Card
                key={r.user_id}
                className={`glass-card transition-all ${
                  isMe ? "border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : "border-border/40"
                } ${i < 3 ? "bg-gradient-to-r from-primary/5 to-transparent" : ""}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 flex justify-center">{podiumIcon(i)}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-background">
                    {r.name?.[0]?.toUpperCase() ?? "G"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {r.name} {isMe && <span className="text-xs text-primary">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-accent">{r.level}</span>
                      {" · "}
                      {r.profile_type === "musician" ? "Artista" : "Fã"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-primary">
                      {r.grv_points.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">GRVM</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {user && myPos === -1 && (
        <p className="text-center text-xs text-muted-foreground">
          Você ainda não aparece no top 100. Continue ganhando GRVM!
        </p>
      )}
    </div>
  );
};

export default Ranking;
