import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AiSuggestion() {
  const { profile } = useAuth();
  const [text, setText] = useState<string>("Carregando insight...");

  useEffect(() => {
    if (!profile) return;
    supabase.functions.invoke("ai-groovium", {
      body: {
        action: "suggestion",
        payload: { level: profile.level, grv: profile.grv_points, genres: profile.selected_genres ?? [], name: profile.name },
      },
    }).then(({ data, error }) => {
      if (error || !data?.text) {
        setText(`Faltam alguns GRV para o próximo nível — complete uma missão para acelerar.`);
      } else setText(String(data.text).slice(0, 220));
    });
  }, [profile?.grv_points, profile?.level]);

  return (
    <div className="glass-card rounded-2xl p-5 border border-secondary/30 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shrink-0">
        <Wand2 className="w-5 h-5 text-background" />
      </div>
      <div>
        <div className="font-display font-bold text-sm mb-1 gradient-neon-text">Assistente Groovium</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
