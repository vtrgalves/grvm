import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notif {
  id: string; kind: string; title: string; body: string | null;
  link: string | null; read: boolean; created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications")
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(30);
    setItems((data ?? []) as Notif[]);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems(prev => [payload.new as Notif, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter(i => !i.read).length;

  const markAll = async () => {
    await supabase.rpc("mark_all_notifications_read");
    setItems(prev => prev.map(i => ({ ...i, read: true })));
  };

  const onClick = (n: Notif) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const icon = (k: string) => ({
    follow: "👤", like: "❤️", comment: "💬", tip: "💸",
    sale: "🛒", drop_live: "🔴", drop_sale: "📦",
  } as Record<string, string>)[k] ?? "🔔";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" onClick={() => { if (!open && unread) markAll(); }}>
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-accent text-background text-[10px] font-bold animate-pulse">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-card border-border/40" align="end">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <span className="font-display font-bold text-sm">Notificações</span>
          {items.length > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline">Marcar lidas</button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem notificações ainda</p>
          ) : items.map(n => (
            <button key={n.id} onClick={() => onClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-border/20 hover:bg-card/50 transition flex gap-3 ${!n.read ? "bg-primary/5" : ""}`}>
              <span className="text-xl flex-shrink-0">{icon(n.kind)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
