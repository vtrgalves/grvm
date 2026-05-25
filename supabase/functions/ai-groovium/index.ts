// IA Groovium - Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MODEL = "google/gemini-2.5-flash";

type Action =
  | "artist_bio"
  | "drop_concept"
  | "experience_suggestion"
  | "artists_to_follow"
  | "suggestion";

interface ReqBody {
  action: Action;
  payload: Record<string, unknown>;
}

const prompts: Record<Action, (p: any) => { system: string; user: string }> = {
  artist_bio: (p) => ({
    system:
      "Você é um copywriter musical brasileiro especialista em bios de artistas para plataformas Web3. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Crie 3 bios para o artista a seguir.
Nome artístico: ${p.stage_name}
Gênero: ${p.genre}
Influências: ${p.influences}
Estilo: ${p.style}

Retorne JSON: { "short": "bio curta (até 140 chars)", "professional": "bio profissional (3-4 frases)", "web3": "bio estilo Spotify/Web3, futurista, com emojis sutis (3 frases)" }`,
  }),
  drop_concept: (p) => ({
    system:
      "Você é diretor criativo de drops musicais NFT. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Projeto: ${p.project}
Emoção: ${p.emotion}
Tipo: ${p.drop_type}

Retorne JSON: { "name": "nome impactante do NFT/drop", "description": "descrição envolvente (2-3 frases)", "cta": "call to action curto e urgente" }`,
  }),
  experience_suggestion: (p) => ({
    system:
      "Você é curador de experiências musicais exclusivas. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Artista: ${p.artist_name}
Gênero: ${p.genre}
Vibe desejada: ${p.vibe ?? "intimista"}

Sugira UMA experiência única para fãs. Retorne JSON: { "event_type": "tipo de evento", "name": "nome criativo da experiência", "description": "descrição curta (2 frases)", "estimated_grv": número inteiro entre 200 e 5000 }`,
  }),
  artists_to_follow: (p) => ({
    system:
      "Você é curador musical do ecossistema Groovium. Sempre responda em PT-BR. Retorne JSON válido sem markdown.",
    user: `Gêneros favoritos do fã: ${(p.genres ?? []).join(", ") || "diversos"}
Cidade: ${p.city ?? "Brasil"}

Sugira 5 artistas (podem ser fictícios mas plausíveis) que esse fã amaria descobrir. Retorne JSON: { "artists": [{ "name": "nome do artista", "genre": "gênero", "reason": "por que seguir (1 frase)", "vibe": "uma palavra que define" }] }`,
  }),
  suggestion: (p) => ({
    system:
      "Você é o assistente do ecossistema Groovium. Responda em PT-BR com UMA única frase motivacional curta (máx 180 chars), tom futurista e direto, sem emojis em excesso. Retorne JSON: { \"text\": \"...\" }",
    user: `Nome: ${p.name ?? "Groover"}
Nível atual: ${p.level ?? "Listener"}
GRV atual: ${p.grv ?? 0}
Gêneros: ${(p.genres ?? []).join(", ") || "—"}

Gere UMA dica curta e personalizada para o próximo passo deste fã (ex: completar missão, descobrir artista, subir de nível).`,
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const builder = prompts[body.action];
    if (!builder) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { system, user } = builder(body.payload ?? {});

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de uso atingido. Tente novamente em instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI Gateway error", detail: txt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
