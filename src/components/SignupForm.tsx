import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const GENRES = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Eletrônica", "Funk",
  "Sertanejo", "MPB", "Jazz", "Reggae", "Metal", "Indie",
  "Lo-fi", "Trap", "Pagode", "Forró",
];

interface SignupFormProps {
  type: "fan" | "musician";
  onBack: () => void;
}

const SignupForm = ({ type, onBack }: SignupFormProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "" });
  const [loading, setLoading] = useState(false);

  const isFan = type === "fan";
  const accentColor = isFan ? "primary" : "accent";

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (form.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            profile_type: type,
            city: form.city,
            selected_genres: selectedGenres,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Update profile with extra data if user was created
      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            city: form.city || null,
            selected_genres: selectedGenres,
          })
          .eq("user_id", data.user.id);
      }

      toast.success(`Conta criada com sucesso! 🎉`);
      navigate(`/welcome?type=${type}`);
    } catch (err) {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 noise-bg scanlines relative overflow-hidden">
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] ${isFan ? "bg-primary/10" : "bg-accent/10"}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] ${isFan ? "bg-secondary/10" : "bg-primary/10"}`} />

      <div className="w-full max-w-lg relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text mb-2">
            {isFan ? "Criar conta de Fã" : "Criar conta de Músico"}
          </h1>
          <p className="text-muted-foreground">
            {isFan ? "Descubra novos artistas" : "Compartilhe seu som"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className={`w-24 h-24 rounded-full border-2 border-dashed border-${accentColor}/40 flex items-center justify-center overflow-hidden bg-muted/30 group-hover:border-${accentColor}/70 transition-colors`}>
                {photo ? (
                  <img src={photo} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              {photo && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPhoto(null); }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <span className="block text-center text-xs text-muted-foreground mt-1">Foto (opcional)</span>
            </label>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-muted/30 border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-muted/30 border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-muted/30 border-border/50 focus:border-primary/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <Label>Gêneros Favoritos</Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const selected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      selected
                        ? isFan
                          ? "bg-primary/20 border-primary/60 text-primary"
                          : "bg-accent/20 border-accent/60 text-accent"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              placeholder="Sua cidade"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="bg-muted/30 border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className={`w-full font-display text-base font-semibold py-6 ${
              isFan
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            } animate-pulse-glow`}
          >
            {loading ? "Criando conta..." : "Finalizar Cadastro"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
