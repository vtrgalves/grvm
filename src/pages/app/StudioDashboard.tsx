import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  TrendingUp, Users, Coins, Package, Radio, Activity, Trophy, Image as ImageIcon, Ticket, ArrowRight,
} from "lucide-react";

interface Dashboard {
  totals: {
    revenue_grv: number; sales_count: number; followers: number;
    items_active: number; drops_active: number; sales_24h: number; revenue_24h: number;
  };
  top_items: Array<{ id: string; title: string; kind: "nft" | "experience"; image_url: string | null; price_grv: number; supply: number; claims: number; revenue: number }>;
  top_fans: Array<{ user_id: string; name: string; handle: string | null; photo_url: string | null; level: string; purchases: number; spent_grv: number }>;
  recent: Array<{ kind: "item" | "drop"; title: string; fan_name: string | null; fan_handle: string | null; price: number; created_at: string }>;
  series: Array<{ day: string; revenue: number; sales: number }>;
}

export default function StudioDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_artist_dashboard");
    if (error) { toast.error(error.message); setLoading(false); return; }
    setData(data as unknown as Dashboard);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center text-muted-foreground py-20">Carregando dashboard...</div>;
  if (!data) return <div className="text-center text-muted-foreground py-20">Sem dados.</div>;

  const maxRevenue = Math.max(1, ...data.series.map(s => s.revenue));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">Dashboard do Artista</h1>
          <p className="text-sm text-muted-foreground">Métricas e insights do seu ecossistema</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/studio"><Button variant="outline" size="sm"><Package className="w-4 h-4 mr-1" /> Studio</Button></Link>
          <Link to="/app/studio/new"><Button size="sm" className="bg-gradient-to-r from-primary to-accent text-background font-bold">Novo item</Button></Link>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<Coins className="w-5 h-5" />} label="Receita GRV" value={data.totals.revenue_grv} hint={`+${data.totals.revenue_24h} em 24h`} accent />
        <KPI icon={<TrendingUp className="w-5 h-5" />} label="Vendas" value={data.totals.sales_count} hint={`+${data.totals.sales_24h} em 24h`} />
        <KPI icon={<Users className="w-5 h-5" />} label="Seguidores" value={data.totals.followers} />
        <KPI icon={<Radio className="w-5 h-5" />} label="Drops/Itens ativos" value={data.totals.items_active + data.totals.drops_active} hint={`${data.totals.drops_active} ao vivo`} />
      </div>

      {/* Revenue Chart */}
      <section className="glass-card rounded-xl p-5 border border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Receita — últimos 14 dias</h2>
          <span className="text-xs text-muted-foreground">{data.series.reduce((a, s) => a + s.revenue, 0)} GRV no período</span>
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.series.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary to-accent transition-all hover:opacity-80"
                style={{ height: `${(s.revenue / maxRevenue) * 100}%`, minHeight: s.revenue > 0 ? "4px" : "1px" }}
              />
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition bg-background border border-border/60 rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                {s.revenue} GRV · {s.sales} vendas
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          <span>{new Date(data.series[0]?.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
          <span>Hoje</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <section className="glass-card rounded-xl p-5 border border-border/40">
          <h2 className="font-display font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Top itens</h2>
          {data.top_items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item criado ainda. <Link to="/app/studio/new" className="text-primary underline">Criar agora</Link></p>
          ) : (
            <ul className="space-y-3">
              {data.top_items.map(it => (
                <li key={it.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {it.image_url ? <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" />
                      : it.kind === "nft" ? <ImageIcon className="w-5 h-5 text-primary/70" /> : <Ticket className="w-5 h-5 text-accent/70" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{it.title}</p>
                    <p className="text-xs text-muted-foreground">{it.claims}/{it.supply} vendidos</p>
                  </div>
                  <span className="font-display font-bold text-sm gradient-neon-text">{it.revenue} GRV</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top Fans */}
        <section className="glass-card rounded-xl p-5 border border-border/40">
          <h2 className="font-display font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Top fãs</h2>
          {data.top_fans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem compradores.</p>
          ) : (
            <ul className="space-y-3">
              {data.top_fans.map((f, i) => (
                <li key={f.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition">
                  <span className="font-display font-bold text-accent w-5 text-center">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-background text-sm flex-shrink-0 overflow-hidden">
                    {f.photo_url ? <img src={f.photo_url} alt={f.name} className="w-full h-full object-cover" /> : f.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    {f.handle ? (
                      <Link to={`/u/${f.handle}`} className="font-bold text-sm hover:text-primary truncate block">{f.name}</Link>
                    ) : <p className="font-bold text-sm truncate">{f.name}</p>}
                    <Badge variant="outline" className="text-[10px] py-0">{f.level}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-sm gradient-neon-text">{f.spent_grv}</p>
                    <p className="text-[10px] text-muted-foreground">{f.purchases} compras</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section className="glass-card rounded-xl p-5 border border-border/40">
        <h2 className="font-display font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Atividade recente</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem vendas ainda. Compartilhe seu perfil para começar!</p>
        ) : (
          <ul className="divide-y divide-border/30">
            {data.recent.map((r, i) => (
              <li key={i} className="py-3 flex items-center gap-3 text-sm">
                <Badge className={r.kind === "drop" ? "bg-accent text-background" : "bg-primary text-background"}>
                  {r.kind === "drop" ? "DROP" : "ITEM"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="font-bold">{r.title}</span>
                    {r.fan_handle ? (
                      <> · <Link to={`/u/${r.fan_handle}`} className="text-primary hover:underline">@{r.fan_handle}</Link></>
                    ) : r.fan_name && <> · {r.fan_name}</>}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <span className="font-display font-bold gradient-neon-text">+{r.price} GRV</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KPI({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`glass-card rounded-xl p-4 border ${accent ? "border-primary/40" : "border-border/40"} relative overflow-hidden`}>
      {accent && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 pointer-events-none" />}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className={accent ? "text-primary" : "text-muted-foreground"}>{icon}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <p className="font-display font-bold text-2xl">{value.toLocaleString("pt-BR")}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  );
}
