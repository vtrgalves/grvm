import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PostAuthor { name: string; level: string; photo_url: string | null; }
interface Post {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: PostAuthor;
  liked_by_me?: boolean;
}
interface Comment {
  id: string; post_id: string; user_id: string; content: string; created_at: string;
  author?: PostAuthor;
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");

  const loadPosts = async () => {
    const { data: rows } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!rows) return;

    const userIds = Array.from(new Set(rows.map(r => r.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, level, photo_url")
      .in("user_id", userIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

    let likedSet = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", rows.map(r => r.id));
      likedSet = new Set((likes ?? []).map(l => l.post_id));
    }

    setPosts(rows.map(r => ({
      ...r,
      author: profileMap.get(r.user_id) as PostAuthor | undefined,
      liked_by_me: likedSet.has(r.id),
    })));
  };

  useEffect(() => { loadPosts(); }, [user]);

  // Realtime: novos posts
  useEffect(() => {
    const channel = supabase
      .channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => loadPosts())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
        setPosts(prev => prev.map(p => p.id === (payload.new as Post).id
          ? { ...p, likes_count: (payload.new as Post).likes_count, comments_count: (payload.new as Post).comments_count }
          : p));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePost = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    const { data, error } = await supabase.rpc("create_post", { _content: draft.trim() });
    setPosting(false);
    if (error) { toast.error("Erro ao publicar"); return; }
    setDraft("");
    const points = (data as any)?.points;
    if (points) toast.success(`+${points} GRV`, { description: "Publicação criada!" });
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    // optimistic
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      liked_by_me: !p.liked_by_me,
      likes_count: p.likes_count + (p.liked_by_me ? -1 : 1),
    } : p));
    const { data, error } = await supabase.rpc("toggle_like", { _post_id: postId });
    if (error) { toast.error("Erro ao curtir"); loadPosts(); return; }
    if ((data as any)?.liked) {
      // reward toast only on like (not unlike)
      // We don't know if it was first time; backend handled it silently.
    }
  };

  const loadComments = async (postId: string) => {
    const { data: rows } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!rows) return;
    const userIds = Array.from(new Set(rows.map(r => r.user_id)));
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, name, level, photo_url").in("user_id", userIds);
    const map = new Map((profiles ?? []).map(p => [p.user_id, p]));
    setCommentsByPost(prev => ({
      ...prev,
      [postId]: rows.map(r => ({ ...r, author: map.get(r.user_id) as PostAuthor | undefined })),
    }));
  };

  const toggleComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!commentsByPost[postId]) await loadComments(postId);
  };

  const submitComment = async (postId: string) => {
    if (!commentDraft.trim()) return;
    const { data, error } = await supabase.rpc("create_comment", {
      _post_id: postId, _content: commentDraft.trim(),
    });
    if (error) { toast.error("Erro ao comentar"); return; }
    setCommentDraft("");
    const points = (data as any)?.points;
    if (points) toast.success(`+${points} GRV`);
    loadComments(postId);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">Feed Social</h1>
        <p className="text-sm text-muted-foreground mt-1">Conecte-se com outros fãs e ganhe GRV ao interagir.</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            placeholder="O que está tocando agora? Compartilhe com a comunidade..."
            className="resize-none bg-background/50 border-border/50 min-h-[80px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{draft.length}/500 · +10 GRV ao publicar</span>
            <Button onClick={handlePost} disabled={!draft.trim() || posting} size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" /> Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Seja o primeiro a postar no feed!</p>
        )}
        {posts.map(post => (
          <Card key={post.id} className="glass-card border-border/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-background">
                  {post.author?.name?.[0]?.toUpperCase() ?? "G"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{post.author?.name ?? "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent">{post.author?.level ?? "Listener"}</span>
                    {" · "}
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{post.content}</p>
              <div className="flex items-center gap-4 pt-2 border-t border-border/40">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    post.liked_by_me ? "text-secondary" : "text-muted-foreground hover:text-secondary"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-current" : ""}`} />
                  {post.likes_count}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {post.comments_count}
                </button>
              </div>

              {openComments === post.id && (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  {(commentsByPost[post.id] ?? []).map(c => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center font-display text-xs text-background font-bold flex-shrink-0">
                        {c.author?.name?.[0]?.toUpperCase() ?? "G"}
                      </div>
                      <div className="flex-1 bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold">{c.author?.name ?? "Usuário"}</p>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      value={openComments === post.id ? commentDraft : ""}
                      onChange={(e) => setCommentDraft(e.target.value.slice(0, 300))}
                      placeholder="Comentar... (+5 GRV)"
                      className="resize-none bg-background/50 min-h-[40px] text-sm"
                    />
                    <Button size="icon" onClick={() => submitComment(post.id)} disabled={!commentDraft.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Feed;
