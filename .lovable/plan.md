
# MVP — Núcleo do Fã (Groovium)

Foco: entregar o **loop completo do fã** (entra → ganha GRV → usa GRV → sobe de nível → volta) sobre a base já existente (signup, profiles, point_transactions, user_missions). Landing evolui, área autenticada nasce.

## 1. Autenticação

- Nova página **/login** com email+senha e botão **Entrar com Google** (via `lovable.auth.signInWithOAuth("google")`).
- Header passa a ter botão "Login" funcional + redirect pós-signup já existente.
- Hook `useAuth` global com `onAuthStateChange` + `getSession`, expondo `user`, `profile`, `loading`.
- Componente `<ProtectedRoute>` para envolver rotas autenticadas; redireciona para `/login` se não logado.
- Recuperação de senha fica fora deste MVP (anotado para próxima fase).

## 2. Layout autenticado (App Shell)

- Novo `AppLayout` com sidebar (desktop) / bottom-nav (mobile), header fixo com saldo GRV, avatar e nível.
- Itens de navegação do fã: **Dashboard, Wallet, Missões, Níveis, NFTs, Experiências** (os 2 últimos com dados mockados).
- Estética mantida: dark, glassmorphism, neon blue/pink — alinhada à memória do projeto.

## 3. Dashboard do Fã (`/app`)

Cards principais:
- **Saldo GRV** (lê `profiles.grv_points`) com animação pulse.
- **Nível atual + barra de progresso** para o próximo nível (regra em `src/lib/levels.ts`).
- **Missões ativas** (top 3 não concluídas de `user_missions`) com CTA "Ver todas".
- **Atividade recente** (últimas 5 linhas de `point_transactions`).
- **Meus NFTs** e **Experiências** — grids mockados (3 cards cada) marcados como "preview".

## 4. Wallet (`/app/wallet`)

- Header: saldo grande + selo "Modo Testnet Groovium".
- Tabs **Ganhos / Gastos / Tudo** sobre `point_transactions` (já tem RLS por `user_id`).
- Cada linha: ícone (recompensa/compra), descrição, data, valor com cor (+verde / -rosa).
- Estado vazio gamificado ("Complete uma missão para começar").

## 5. Missões (`/app/missions`)

- Reaproveita a tela atual `Missions.tsx`, movida para dentro do `AppLayout`.
- Adiciona botão **"Marcar como concluída"** (simulado nesta fase) que:
  1. Atualiza `user_missions.completed = true, completed_at = now()`.
  2. Insere linha em `point_transactions` com os pontos da missão.
  3. Incrementa `profiles.grv_points` (via RPC `claim_mission` — ver técnico).
  4. Dispara toast neon "+X GRV" e re-render do saldo.
- Abas **Diárias / Semanais / Iniciais** — diárias/semanais ficam vazias com placeholder nesta fase.

## 6. Níveis (`/app/levels`)

5 níveis fixos (em `src/lib/levels.ts`):

```text
Listener    0–499 GRV
Supporter   500–1.499
Insider     1.500–3.999
Backstage   4.000–9.999
Legend      10.000+
```

- Timeline vertical com badges, marcando atual e próximos.
- Cada nível lista 2–3 recompensas desbloqueadas (texto, sem CRUD ainda).

## 7. Landing — evolução

- Hero: novo título **"A nova economia da música"** + subtítulo explicando GRV + CTA **"Começar agora"** → `/signup`.
- Substituir/renomear seção "Como funciona" para o trio **Ganhar → Usar → Evoluir**.
- Adicionar seção **Benefícios** com duas colunas (Para fãs / Para artistas).
- Manter Sobre, Roadmap, Carrossel de Artistas, Footer.
- Remover seções que não cabem no novo discurso (Tokenomics já está fora; revisar Differentials).

## 8. Banco de dados (mudanças)

- **RPC `claim_mission(mission_key text)`** (SECURITY DEFINER): valida dono, evita dupla contagem, faz as 3 escritas atômicas (mission, transaction, profile.grv_points). Evita race condition no client.
- **Coluna `profiles.level`** (text) + trigger que recalcula nível ao mudar `grv_points`.
- Sem novas tabelas para NFTs/Experiências nesta fase (mock no front).

## 9. Detalhes técnicos

- `src/hooks/useAuth.tsx` — Provider + hook.
- `src/hooks/useProfile.tsx` — assina `profiles` via Supabase Realtime para atualizar saldo em tempo real após missões.
- `src/lib/levels.ts` — `LEVELS`, `getLevel(points)`, `getProgressToNext(points)`.
- `src/components/app/AppLayout.tsx`, `Sidebar.tsx`, `MobileNav.tsx`, `GrvBalance.tsx`, `LevelBadge.tsx`.
- Rotas adicionadas em `App.tsx`: `/login`, `/app`, `/app/wallet`, `/app/missions`, `/app/levels`, `/app/nfts`, `/app/experiences` (todas dentro de `<ProtectedRoute><AppLayout>`).
- Migration cria a função `claim_mission`, coluna `level` e trigger.
- Realtime habilitado para `profiles` e `point_transactions`.

## Fora do escopo (próximas fases)

Área do Artista, Feed Social, Ranking, Explorer, Burn, Eventos, Clube VIP, NFTs/Experiências persistidos, recuperação de senha.
