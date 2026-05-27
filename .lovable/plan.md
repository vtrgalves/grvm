# Evolução do Proof of Support Oracle — GRVM Reputation Engine

Transformar o Oracle no coração do Groovium: motor de reputação Web3 gamificado com Smart Actions, score dinâmico 0–1000, 7 ranks, prova real na Solana Devnet e UX acessível para leigos. Sem quebrar wallet, crates, boosts, NFTs, auth, feed ou gamificação.

## O que muda

### 1. Backend / Edge Function (`oracle-analyze`)
- **Score 2.0 (0–1000)**: recalibrar fórmula com peso por categoria (engagement, social, support, collector, frequency) + penalidade de inatividade.
- **7 ranks novos**: Rookie · Supporter · Insider · Groove Hunter · Viral Supporter · Legendary · Genesis Icon (substitui Rookie/Rising/Viral/Legendary).
- **Smart Actions agregadas**: derivar últimas N ações relevantes do `point_transactions` + interações sociais, classificar cada uma com label/icon/impacto reputacional, devolver no payload.
- **AI insight mais humano**: prompt revisado para frases de comportamento ("você apoia antes da tendência", "perfil de colecionador") sem inventar números.
- **Memo Solana enriquecido**: inclui `activity_hash` (hash agregado das smart actions) + score + rank.
- **Fallback graceful** mantido (já existe).

### 2. RPCs Supabase
- `compute_engagement_metrics` ganha campos extras: `grv_spent`, `grv_earned`, `recent_activity_count`, `days_since_last_action`.
- Nova RPC `get_smart_actions(_uid, _limit)` — retorna últimas ações tipadas com impacto reputacional para o card timeline.
- `record_oracle_sync` aceita `_smart_actions` jsonb e `_rank` novo (compatível com ranks antigos).

### 3. Frontend — `ProofOfSupportOracle.tsx`
- **Sync stepper visual** (5 etapas animadas):
  1. "Lendo sua atividade no ecossistema GRVM" (counters: likes/follows/NFTs/boosts/crates/missões)
  2. "Chainlink CRE analisando comportamento"
  3. "Gerando reputação musical" (score animado subindo do anterior → novo)
  4. "Registrando Oracle Proof na Solana" (txid/slot/explorer)
  5. "Reputação sincronizada" (delta de reputação + GRVM)
- **Score 0–1000** com barra de progresso por rank + cor por rank.
- **Smart Actions Timeline card** — "Sua atividade virou reputação Web3" com ícone + label + delta de reputação.
- **Modal "Como funciona?"** — explicação para leigos (Web2 Activity → CRE → Solana → GRVM Reputation).
- Manter cards existentes (workflow, external signals, Solana proof) sem quebrar.

### 4. Landing Page
- Nova seção `OracleReputationSection.tsx` entre `Web3StackSection` e `RoadmapSection`:
  - Headline: "Sua reputação musical agora é verificável."
  - Fluxo visual: Web2 Activity → Chainlink CRE → Solana Oracle Proof → GRVM Reputation
  - 4 cards/steps com ícones cyberpunk.

### 5. Não muda
- Schema de tabelas (apenas RPC nova + colunas já existentes em `oracle_activity`).
- Auth, OAuth Google, wallet, crates, boosts, NFTs, ranking, feed, missões.
- Economia GRVM (Web2 simulado).
- Fluxo de checkout, tip, follow, like.

## Detalhes técnicos

```text
score = clamp(0, 1000,
  log10(1+grv_earned)*40           // base
  + missions*12 + nft*18 + badges*30 + boosts*22
  + min(streak,30)*6 + tips_sent*14
  + (follows*4 + likes*1.5 + comments*2.5)   // social
  + crates*8
  + market_bonus(eth_24h) + music_bonus
  - inactivity_penalty(days_since_last_action)
)
```

Ranks por faixa (matriz no edge function + frontend helper compartilhado em `src/lib/oracle.ts`).

Smart Actions derivadas mapeando `point_transactions.action` → `{label, icon, reputation_delta}`:
- `mission_complete` → ⚡ +15
- `item_purchase` / `live_drop_purchase` → 🎵 +32
- `crate_open` → 🔥 +18
- `post_comment` → 💬 +8
- `follow_artist` → 🎧 +10
- `tip_sent` → 💸 +25
- `badge_earned` → 🏆 +40

## Riscos & mitigação
- **Migração de RPC**: mantenho compatibilidade — `record_oracle_sync` ganha parâmetro opcional, ranks antigos continuam aceitos.
- **Performance**: Smart Actions limitadas a 20 últimas, derivadas em SQL (sem N+1).
- **Solana custo**: 1 memo por sync (já é assim), não por smart action.
- **Fallback**: se RPC `get_smart_actions` falhar, frontend mostra estado vazio com mensagem amigável.

## Ordem de execução
1. Migration: nova RPC `get_smart_actions` + ampliar `compute_engagement_metrics`.
2. Helper compartilhado `src/lib/oracle.ts` (ranks + smart action mapping).
3. Edge function `oracle-analyze` — score 2.0 + smart actions no payload + prompt IA novo.
4. `ProofOfSupportOracle.tsx` — stepper, score 0–1000, timeline, modal "Como funciona?".
5. Landing — `OracleReputationSection.tsx` + plug no `Index.tsx`.
