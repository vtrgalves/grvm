import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const PRESETS = [10, 50, 100, 500];

export default function TipDialog({ toUserId, toName, trigger }: { toUserId: string; toName: string; trigger?: React.ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(50);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!amount || amount <= 0) return toast.error("Valor inválido");
    if (profile && amount > profile.grv_points) return toast.error("Saldo insuficiente");
    if (message.length > 200) return toast.error("Mensagem muito longa");
    setBusy(true);
    const { error } = await supabase.rpc("send_tip", { _to: toUserId, _amount: amount, _message: message });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`+${amount} GRV enviados para ${toName}!`, { description: "Obrigado por apoiar 🎵" });
    refreshProfile();
    setOpen(false); setMessage(""); setAmount(50);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="border-accent/50 hover:bg-accent/10">
            <Heart className="w-4 h-4 mr-1 text-accent" /> Apoiar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card border-border/40">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Enviar tip para {toName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(v => (
              <Button key={v} variant={amount === v ? "default" : "outline"}
                className={amount === v ? "bg-gradient-to-r from-primary to-accent text-background font-bold" : ""}
                onClick={() => setAmount(v)}>
                {v}
              </Button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Valor personalizado (GRV)</label>
            <Input type="number" min={1} max={100000} value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mensagem (opcional)</label>
            <Textarea maxLength={200} placeholder="Manda um recado..." value={message}
              onChange={e => setMessage(e.target.value)} />
          </div>
          {profile && (
            <p className="text-xs text-muted-foreground">
              Seu saldo: <span className="font-bold text-primary">{profile.grv_points} GRV</span>
            </p>
          )}
          <Button onClick={submit} disabled={busy}
            className="w-full bg-gradient-to-r from-primary to-accent text-background font-bold">
            {busy ? "Enviando..." : `Enviar ${amount} GRV`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
