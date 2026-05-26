// IA Groovium - Lovable AI Gateway (authenticated + rate limited)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-2.5-flash";

const RATE_PER_MIN = 10;
const RATE_PER_DAY = 100;

type Action =
  | "artist_bio" | "drop_concept" | "experience_suggestion"
  | "artists_to_follow" | "suggestion";

interface ReqBody { action: Action; payload: Record<string, unknown>; }

const prompts: Record<Action, (p: any) => { system: string; user: string }> = {
  artist_bio: (p) => ({
    system: "Você é um copywriter musical brasileiro especialista em bios de artistas para plataformas Web3. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Crie 3 bios para o artista a seguir.\nNome artístico: ${p.stage_name}\nGênero: ${p.genre}\nInfluências: ${p.influences}\nEstilo: ${p.style}\n\nRetorne JSON: { "short": "bio curta (até 140 chars)", "professional": "bio profissional (3-4 frases)", "web3": "bio estilo Spotify/Web3, futurista, com emojis sutis (3 frases)" }`,
  }),
  drop_concept: (p) => ({
    system: "Você é diretor criativo de drops musicais NFT. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Projeto: ${p.project}\nEmoção: ${p.emotion}\nTipo: ${p.drop_type}\n\nRetorne JSON: { "name": "nome impactante do NFT/drop", "description": "descrição envolvente (2-3 frases)", "cta": "call to action curto e urgente" }`,
  }),
  experience_suggestion: (p) => ({
    system: "Você é curador de experiências musicais exclusivas. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Artista: ${p.artist_name}\nGênero: ${p.genre}\nVibe desejada: ${p.vibe ?? "intimista"}\n\nSugira UMA experiência única para fãs. Retorne JSON: { "event_type": "tipo de evento", "name": "nome criativo da experiência", "description": "descrição curta (2 frases)", "estimated_grv": número inteiro entre 200 e 5000 }`,
  }),
  artists_to_follow: (p) => ({
    system: "Você é curador musical do ecossistema Groovium. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Gêneros favoritos do fã: ${(p.genres ?? []).join(", ") || "diversos"}\nCidade: ${p.city ?? "Brasil"}\n\nSugira 5 artistas (podem ser fictícios mas plausíveis) que esse fã amaria descobrir. Retorne JSON: { "artists": [{ "name": "nome do artista", "genre": "gênero", "reason": "por que seguir (1 frase)", "vibe": "uma palavra que define" }] }`,
  }),
  suggestion: (p) => ({
    system: "Você é o assistente do ecossistema Groovium. Responda em PT-BR com UMA única frase motivacional curta (máx 180 chars), tom futurista e direto, sem emojis em excesso. Retorne JSON: { \"text\": \"...\" }",
    user: `Nome: ${p.name ?? "Groover"}\nNível atual: ${p.level ?? "Listener"}\nGRV atual: ${p.grv ?? 0}\nGêneros: ${(p.genres ?? []).join(", ") || "—"}\n\nGere UMA dica curta e personalizada para o próximo passo deste fã.`,
  }),
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    // --- AUTH ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = (await req.json()) as ReqBody;
    const builder = prompts[body.action];
    if (!builder) return json({ error: "Invalid action" }, 400);

    // --- RATE LIMIT ---
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const sinceMin = new Date(Date.now() - 60_000).toISOString();
    const sinceDay = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: perMin }, { count: perDay }] = await Promise.all([
      admin.from("ai_usage_log").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", sinceMin),
      admin.from("ai_usage_log").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", sinceDay),
    ]);
    if ((perMin ?? 0) >= RATE_PER_MIN) {
      return json({ error: "Rate limit: aguarde alguns segundos." }, 429);
    }
    if ((perDay ?? 0) >= RATE_PER_DAY) {
      return json({ error: "Limite diário de IA atingido. Volte amanhã." }, 429);
    }

    const { system, user } = builder(body.payload ?? {});

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Limite de uso atingido. Tente novamente em instantes." }, 429);
    if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402);
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return json({ error: "AI Gateway error", detail: txt }, 500);
    }

    // Log usage (fire and forget)
    admin.from("ai_usage_log").insert({ user_id: userId, action: body.action })
      .then(() => {}, () => {});

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return json({ result: parsed });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
