import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  profile_type: "fan" | "musician";
  city: string | null;
  photo_url: string | null;
  grv_points: number;
  level: string;
  selected_genres: string[] | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (!data) {
      // Auto-create profile (handles OAuth users where the DB trigger didn't fire)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (meta.full_name as string) ||
        (meta.name as string) ||
        (authUser?.email?.split("@")[0] ?? "Groover");
      const photo_url = (meta.avatar_url as string) || (meta.picture as string) || null;
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          user_id: uid,
          name,
          email: authUser?.email ?? null,
          photo_url,
          profile_type: "fan",
          grv_points: 100,
          level: "Listener",
        })
        .select("*")
        .maybeSingle();
      data = created;
    }

    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchProfile(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime profile updates (saldo GRV em tempo real)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => setProfile(payload.new as Profile),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
