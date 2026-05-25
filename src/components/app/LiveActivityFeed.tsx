import { useEffect, useState } from "react";
import { Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string; user_name: string; action: string; points: number; description: string | null; created_at: string;
}

const friendly = (a: string) => ({
  signup_bonus: "🎉 Boas-vindas", mission_complete: "✅ Missão",
  post_create: "📝 Post", post_like: "❤️ Curtida", post_comment: "💬 Comentário",
  follow_artist: "🎤 Seguiu artista", tip_sent: "💸 Tip enviado", tip_received: "💜 Tip recebido",
  item_sale: "💰 Venda", item_purchase: "🛒 Compra", live_drop_sale: "🔥 Drop vendido",
  live_drop_purchase: "🎟️ Drop comprado", vip_claim: "👑 VIP", badge_burn: "🔥 Burn badge",
  daily_checkin: "📅 Check-in",
}[a] || "⚡ Ação");

export default function LiveActivityFeed() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.rpc as any)("get_explorer_feed", { _limit: 12 });
      if (data) setRows(data as Row[]);
    };
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary animate-pulse" /> Atividade ao vivo
        </h2>
        <span className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-widest text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
        </span>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {rows.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Sem atividade.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
            <Zap className={`w-3.5 h-3.5 shrink-0 ${r.points >= 0 ? "text-primary" : "text-accent"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate">
                <span className="text-muted-foreground">{friendly(r.action)} · </span>
                <span className="text-foreground">{r.user_name}</span>
              </div>
              <div className="text-[10px] text-muted-foreground/70">{new Date(r.created_at).toLocaleTimeString("pt-BR")}</div>
            </div>
            <div className={`font-display font-bold text-xs ${r.points >= 0 ? "text-primary" : "text-accent"}`}>
              {r.points >= 0 ? "+" : ""}{r.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
