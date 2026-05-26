import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Heart, ArrowLeft, Sparkles, Loader2, Mail } from "lucide-react";
import SignupForm from "@/components/SignupForm";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

type ProfileType = "fan" | "musician" | null;

const Signup = () => {
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [emailFlow, setEmailFlow] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigate = useNavigate();

  if (emailFlow && profileType) {
    return <SignupForm type={profileType} onBack={() => setEmailFlow(false)} />;
  }

  const handleGoogle = async () => {
    if (!profileType) {
      toast.error("Escolha o seu perfil primeiro");
      return;
    }
    setLoadingGoogle(true);
    localStorage.setItem("selected_profile_type", profileType);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) {
        toast.error("Falha ao conectar com Google");
        setLoadingGoogle(false);
        return;
      }
      if (result.redirected) return;
      navigate("/app");
    } catch {
      toast.error("Falha ao conectar com Google");
      setLoadingGoogle(false);
    }
  };

  const isFan = profileType === "fan";
  const isMus = profileType === "musician";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 noise-bg scanlines relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-2xl relative z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-neon-text mb-3">
            Criar Conta
          </h1>
          <p className="text-muted-foreground text-lg">Escolha o seu perfil</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Fan */}
          <button
            onClick={() => setProfileType("fan")}
            className={`glass-card rounded-2xl p-8 text-left group transition-all duration-300 cursor-pointer ${
              isFan
                ? "border-primary/70 shadow-[0_0_40px_hsl(var(--primary)/0.35)] scale-[1.02]"
                : "hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
            }`}
          >
            <div className={`w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 transition-transform ${isFan ? "scale-110" : "group-hover:scale-110"}`}>
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 text-foreground">Sou Fã</h2>
            <p className="text-muted-foreground">
              Descubra novos artistas, ouça músicas exclusivas e faça parte da revolução musical.
            </p>
          </button>

          {/* Musician */}
          <button
            onClick={() => setProfileType("musician")}
            className={`glass-card rounded-2xl p-8 text-left group transition-all duration-300 cursor-pointer ${
              isMus
                ? "border-accent/70 shadow-[0_0_40px_hsl(var(--accent)/0.35)] scale-[1.02]"
                : "hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)]"
            }`}
          >
            <div className={`w-16 h-16 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-6 transition-transform ${isMus ? "scale-110" : "group-hover:scale-110"}`}>
              <Music className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 text-foreground">Sou Músico</h2>
            <p className="text-muted-foreground">
              Compartilhe seu som, conecte-se com fãs e monetize sua arte na blockchain.
            </p>
          </button>
        </div>

        {/* Auth area */}
        <div
          className={`glass-card rounded-2xl p-6 md:p-8 transition-all duration-500 ${
            profileType ? "opacity-100 translate-y-0" : "opacity-50 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-display text-xl font-bold gradient-neon-text">Entre na Frequência</h3>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Crie sua identidade musical em segundos.</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={!profileType || loadingGoogle}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-primary/40 bg-background/60 hover:bg-primary/10 hover:border-primary/70 hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] transition-all font-display font-semibold disabled:opacity-60"
          >
            {loadingGoogle ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
            )}
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <button
            onClick={() => profileType && setEmailFlow(true)}
            disabled={!profileType}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-sm font-medium disabled:opacity-60"
          >
            <Mail className="w-4 h-4" />
            Cadastrar com email e senha
          </button>

          <ul className="mt-6 space-y-1.5 text-xs text-muted-foreground">
            <li>✅ +2000 GRVM iniciais</li>
            <li>✅ Perfil gamificado</li>
            <li>✅ NFTs e experiências exclusivas</li>
            <li>✅ Powered by Chainlink CRE</li>
            <li>✅ Future on Solana</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
