import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Heart, ArrowLeft } from "lucide-react";
import SignupForm from "@/components/SignupForm";

type ProfileType = "fan" | "musician" | null;

const Signup = () => {
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const navigate = useNavigate();

  if (profileType) {
    return <SignupForm type={profileType} onBack={() => setProfileType(null)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 noise-bg scanlines relative overflow-hidden">
      {/* Background glow effects */}
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

        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-neon-text mb-3">
            Criar Conta
          </h1>
          <p className="text-muted-foreground text-lg">Escolha o seu perfil</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fan Card */}
          <button
            onClick={() => setProfileType("fan")}
            className="glass-card rounded-2xl p-8 text-left group hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 text-foreground">
              Sou Fã
            </h2>
            <p className="text-muted-foreground">
              Descubra novos artistas, ouça músicas exclusivas e faça parte da revolução musical.
            </p>
          </button>

          {/* Musician Card */}
          <button
            onClick={() => setProfileType("musician")}
            className="glass-card rounded-2xl p-8 text-left group hover:border-accent/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Music className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 text-foreground">
              Sou Músico
            </h2>
            <p className="text-muted-foreground">
              Compartilhe seu som, conecte-se com fãs e monetize sua arte na blockchain.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
