## Objetivo

Posicionar o Groovium como projeto **Powered by Chainlink CRE** e **Future on Solana**, padronizando a sigla oficial **GRVM** em toda a Landing Page e App — mantendo identidade cyberpunk, sem poluir o visual.

---

## Escopo por área

### 1. Componentes novos compartilhados
- `src/components/Web3Badges.tsx` — par de badges `[Powered by Chainlink CRE] [Future on Solana]` com tooltip, glow discreto, usado no Header da Landing e no rodapé da Sidebar do App.
- `src/components/Web3FutureModal.tsx` — modal educativo "O Futuro Web3 do GRVM" (hoje vs. futuro, com logos).
- `src/assets/chainlink-logo.svg` e `src/assets/solana-logo.svg` — SVGs inline minimalistas (sem download externo, ~30 linhas cada).

### 2. Landing Page
- **Header** (`Header.tsx`): adicionar `<Web3Badges />` à direita, antes dos botões.
- **HeroSection**: faixa fina abaixo do CTA — "⚡ Powered by Chainlink CRE · ◎ Future Solana Ecosystem" + frase curta.
- **Nova seção `Web3StackSection.tsx`**: 3 cards glassmorphism (Chainlink CRE, Solana, IA Groovium) inserida entre `DifferentialsSection` e `RoadmapSection` em `pages/Index.tsx`.
- **RoadmapSection**: adicionar 5ª fase "Fase Web3" (Wallet Solana, Token GRVM, NFTs on-chain, Oracle Reputation, Chainlink Automation, SocialFi).

### 3. App autenticado
- **AppSidebar** (footer): badges compactos Chainlink/Solana abrindo `Web3FutureModal`.
- **AppLayout / Header**: trocar pill "GRV" por "GRVM" (label visual apenas).
- **Wallet** (`pages/app/Wallet.tsx`): label "Saldo atual" mantém — trocar "GRV" → "GRVM"; adicionar bloco "Future Solana Wallet" com selo "Web3 Expansion · In Development".
- **ProofOfSupportOracle**: adicionar header badge "Powered by Chainlink CRE" + descrição curta + link oficial.
- **NFTs** (`pages/app/NFTs.tsx`): selo "Future Solana NFTs" no topo.
- **Boosts / Crates / Missions**: adicionar pequenos chips ("Chainlink Verified Activity", "Future Solana Reward", "Oracle Synced") onde fizer sentido — uma referência sutil por página, sem exagero.
- **Ranking**: título "Top GRVM Artists".

### 4. Padronização GRVM (busca global)
Substituir em strings de UI:
- `GRV ` (com espaço, em labels de saldo/pontos) → `GRVM`
- `Grovium` (typo) → `Groovium`
- `GRVM Coin` → `Groovium (GRVM)` quando usado como nome do projeto
- Manter referências internas a `grv_points` no schema (não mexer no DB).

Arquivos com referências confirmadas a revisar: `Wallet.tsx`, `AppLayout.tsx`, `Dashboard.tsx`, `HeroSection.tsx`, `Boosts.tsx`, `Crates.tsx`, `MissionsApp.tsx`, `Ranking.tsx`, `Levels.tsx`, `ProfileEdit.tsx`, `WelcomeOverlay.tsx`, etc.

### 5. Estilo
- Reusar tokens existentes (`--primary`, `--accent`, `--secondary`).
- Adicionar 2 utilitários em `index.css`: `.chainlink-glow` (azul) e `.solana-glow` (gradiente verde→roxo).
- Logos SVG inline com `currentColor` para herdar tema.

---

## Detalhes técnicos

- Nenhuma mudança de schema/migration — alteração puramente visual e de copy.
- Nenhuma alteração nas RPCs ou edge functions.
- Badges usam `Tooltip` do shadcn (já instalado).
- Modal usa `Dialog` do shadcn.
- Links abrem em nova aba (`target="_blank" rel="noopener"`).

---

## Fora de escopo

- Integração real com Solana (wallet adapter, RPC).
- Migração do token GRV→GRVM no banco (campos `grv_points`, tabelas mantêm nome interno).
- Substituição em comentários de código ou nomes de variáveis.
- Correções de segurança pendentes (boost RPC, ai-groovium auth) — já endereçadas em turnos anteriores ou exigem turno dedicado.

---

## Resultado esperado

Landing com autoridade Web3, App com narrativa Chainlink/Solana presente mas elegante, sigla **GRVM** consistente. Visual cyberpunk preservado, sem poluição de logos.
