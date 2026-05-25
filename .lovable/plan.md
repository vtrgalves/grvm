
# Groovium BETA — Plataforma viva simulada (Web 2.0 + estética Web3)

Objetivo: deixar a plataforma com sensação de "já está rodando" — saldo inicial, artistas, NFTs, experiências, feed, ranking, transações e animações de GRV em tempo real — tudo simulado, marcado como **BETA**, sem blockchain real.

A base já existe (auth, GRV, missões, drops, VIP, badges, IA, tipping, notificações, feed, ranking). O trabalho aqui é principalmente: **seed de dados**, **UX BETA/Web3 em construção**, **microinterações de ganho de GRV** e **fluxos visuais "vivos"**.

---

## 1. Modo BETA (global)

- Componente `BetaBadge` no header (ao lado do sino) e no rodapé da sidebar — chip neon pulsante `BETA*`.
- Ao clicar → `BetaDialog` (shadcn Dialog) explicando que GRV/NFTs/experiências são fictícios para testes e que na Web3 real os usuários conectarão wallet. Botão **Entendi** com `localStorage` para não reabrir automaticamente.
- Auto-abrir o modal uma única vez no primeiro login (flag `grv_beta_seen`).

## 2. Barra "Web3 em construção"

- Faixa fixa no topo do `Dashboard` (acima das saudações): 🚧 **WEB3 EM CONSTRUÇÃO** — "Adquira Grooviums em Web3 (Em breve)" + botão **Cadastrar Wallet**.
- Botão abre `WalletConnectDialog` com 3 cards: MetaMask, Phantom, WalletConnect. Cada card mostra estado **Em construção** (badge cinza-neon) e toast "Disponível no lançamento Web3". Animação glow/scan-line no contorno do modal.
- Dispensável (X) — não obrigatório fechar.

## 3. Saldo inicial e onboarding

- O signup já dá +100/+200 GRV. **Ajuste** o trigger `handle_new_user` para conceder **+500 GRV** ao fã (mantém +200 ao artista + bônus separado se quiser).
- Toast/overlay animado na primeira entrada pós-signup: "Bem-vindo ao Groovium. Você recebeu 500 GRV para começar sua jornada." (usa flag `grv_welcome_seen`).

## 4. Ganho de GRV em tempo real (camada visual)

- Novo provider `GrvFxProvider` (Context) com `notifyGain(points, reason)`.
- Quando qualquer RPC retorna `points`/`amount` (claim_mission, toggle_like, create_post, create_comment, toggle_follow, claim_artist_item, claim_live_drop, claim_vip_perk, daily_checkin), dispara:
  - Toast custom neon `+N GRV` com ícone Coins.
  - Animação flutuante "+N GRV" subindo do botão clicado (motion div absoluto, fade-up 800ms).
  - Pulso glow no chip de saldo do header.
- O saldo do header recarrega `profile` via `useAuth().refresh()` após cada ação (já em uso em alguns lugares — padronizar).

## 5. Login diário (streak)

- Nova tabela `daily_checkins(user_id, day date, streak int)` + RPC `daily_checkin()` que dá **+20 GRV** uma vez por dia e incrementa streak.
- Card no Dashboard: "🔥 Streak X dias — Resgatar +20 GRV" (desabilita se já feito hoje).

## 6. Seed de conteúdo (plataforma "viva")

Migration de seed (idempotente via `ON CONFLICT`):

- **3 artistas fictícios** (profiles `profile_type='musician'` com `user_id` fixo UUID determinístico — sem `auth.users`, só registros em `profiles` para listagem/exibição):
  - Neon Frequency — Synthwave/EDM
  - Luna Vox — Pop Futurista
  - CyberGroove — Hip Hop Futurista
  - Cada um com bio, handle, photo_url (gerado), level, grv_points alto.
- **NFTs/Itens** (`artist_items`): 3 por artista (Neon Pulse #001, Frequency Core, VIP Wave Pass / Luna Genesis, Vox Signature, Aurora Sound Pass / CyberBeat Drop, Urban Hologram, Street Wave Pass).
- **Experiências** (`artist_items` kind=experience ou `vip_perks`): VIP Listening Session, Meet & Greet Digital, Backstage Live, Hologram Experience, Studio Access.
- **Posts seed** no feed (5–8 posts dos artistas fictícios).
- **Ranking seed**: como profiles têm `grv_points`, esses artistas já aparecem. Adicionar 5 perfis "fan" fictícios para popular top fãs (Lucas Neon, Ana Wave, CyberMike, etc.).

Observação: `profiles.user_id` não tem FK para `auth.users` no schema atual, então seeds funcionam.

## 7. Atividade automática (feed/explorer)

- Edge function cron `simulate-activity` (a cada 2 min via pg_cron + pg_net):
  - Insere 1–2 `point_transactions` aleatórias dos perfis fictícios ("+X GRV por seguir Neon Frequency", "+50 GRV missão diária", etc.) — só para popular Explorer/Ranking dinâmico.
  - Ocasionalmente cria um `post` curto de artista fictício.
- Marca essas transações com `action='simulated_*'` para poder filtrar/limpar depois.

## 8. Dashboard reformulado

Reorganizar `src/pages/app/Dashboard.tsx` em blocos gamificados:

1. Barra Web3 em construção (topo)
2. Saudação + streak diário (resgatar +20)
3. Cards: Saldo GRV (com pulso) | Nível + progresso | Posição no ranking ("Você está em #N")
4. **Atividade ao vivo** (últimas tx globais via `get_explorer_feed` — atualiza a cada 10s) com glow neon
5. Missões ativas (já existe — manter)
6. Artistas recomendados (3 cards horizontais com os artistas seed)
7. NFTs em destaque (grid de 3 dos itens seed)
8. Experiências (3 cards)
9. Sugestão IA Groovium (1 frase do `ai-groovium` action `suggestion`) — "Você está próximo do nível Insider"

## 9. Wallet — etiqueta "Modo Simulado"

- No `Wallet.tsx` o card já diz "Modo Testnet Groovium". Trocar por chip **Modo Simulado · BETA** com tooltip explicando o BETA.

## 10. NFTs — link OpenSea

- `NFTs.tsx`: adicionar seção "NFTs Oficiais Groovium" no topo com botão **Ver Coleção** → abre `https://opensea.io/collection/groovium` em nova aba. Manter grid de itens existente abaixo.

## 11. IA Groovium — sugestões contextuais

- Adicionar no edge function `ai-groovium` a action `suggestion` (recebe nível atual + GRV atual + gêneros) e retorna 1 frase curta motivacional ("Faltam 320 GRV para Insider — complete 'Curtir 5 músicas' para chegar lá").
- Usar no Dashboard como card "Assistente Groovium".

## 12. Animações e microinterações

- Tailwind: adicionar keyframes `grv-pop` (scale 0.8→1.1→1 + glow) e `grv-float` (translateY -40px + fade).
- Hover scale nos cards de artista/NFT/experiência.
- Partículas leves (reutiliza `Particles.tsx`) no fundo do Dashboard.

---

## Resumo técnico (para o dev)

**Migrations:**
- Alterar `handle_new_user`: fã = 500 GRV.
- Criar tabela `daily_checkins` + RPC `daily_checkin`.
- Adicionar action `suggestion` no edge function `ai-groovium`.
- Seed determinística de 3 artistas + 5 fãs + 9 itens + 5 experiências + posts.
- Habilitar `pg_cron` + `pg_net` e agendar `simulate-activity` (via supabase--insert, não migration, pois inclui anon key).

**Edge functions:**
- `simulate-activity` (nova): insere tx/posts aleatórios.
- `ai-groovium` (existente): nova action `suggestion`.

**Frontend:**
- `BetaBadge.tsx`, `BetaDialog.tsx`, `WalletConnectDialog.tsx`, `Web3ConstructionBar.tsx`, `DailyCheckin.tsx`, `LiveActivityFeed.tsx`, `GrvFxProvider.tsx` (toast/animação de ganho), `WelcomeOverlay.tsx`.
- Refatorar `Dashboard.tsx` na nova ordem.
- Atualizar `Wallet.tsx` (chip simulado), `NFTs.tsx` (botão OpenSea), `AppLayout.tsx` (BetaBadge no header), `AppSidebar.tsx` (BetaBadge no footer), `App.tsx` (envolver com `GrvFxProvider`).
- Adicionar keyframes em `tailwind.config.ts` + `index.css`.

**Sem mudanças em:** auth fluxo, RLS existentes (apenas adições), tipografia/cores (mantém cyberpunk neon).

---

## Fora de escopo (não fazer agora)

- Wallet real, pagamentos reais, mint real de NFT.
- Áudio real / som de feedback (apenas visual).
- Mensagens diretas, comentários aninhados, upload de imagens.
