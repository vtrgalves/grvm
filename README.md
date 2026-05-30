# Groovium (GRVM) 🎵

> **Music Reputation Infrastructure**
> Groovium é um ecossistema que conecta artistas e fãs, transformando engajamento musical
> em **reputação verificável on-chain** via Chainlink CRE + Solana Devnet.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-FF2D95?style=for-the-badge)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18-00D4FF?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Chainlink](https://img.shields.io/badge/Chainlink-CRE-375BD2?style=for-the-badge&logo=chainlink&logoColor=white)](https://chain.link)
[![Supabase](https://img.shields.io/badge/Lovable%20Cloud-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Status](https://img.shields.io/badge/Status-MVP%20Online-22c55e?style=for-the-badge)](https://grvm.lovable.app)

---

## 🌐 Live

- **Produção:** https://grvm.lovable.app
- **Domínios oficiais:** https://groovium.life · https://www.groovium.life
- **NFT Collection (oficial):** https://opensea.io/collection/groovium

---

## ✨ Sobre

Groovium **não é mais um projeto de token** — é uma **infraestrutura de reputação musical**
que une fãs, artistas, IA e provas on-chain. Cada interação no ecossistema (curtidas, missões,
apoio, coleções, tips) alimenta o **Reputation Score (0–1000)**, ancorado periodicamente na
**Solana Devnet** via **Chainlink CRE (Hybrid Oracle)**.

O MVP já está online: o usuário entra, interage, vê sua reputação subir e o **Proof of Support
Oracle** registrando provas reais na Devnet.

### Princípios

- 🫀 **Groovium Heart** — núcleo de reputação musical do usuário, vivo e verificável
- 🤖 **IA Comportamental** — analisa perfil e gera Smart Actions personalizadas
- 🔗 **Chainlink CRE** — workflow híbrido que orquestra IA + dados + on-chain
- ◎ **Solana Devnet** — provas SHA-256 ancoradas via Memo Program
- 🎮 **Gamificação real** — missões, boosts, crates, NFTs, ranking, clube VIP

---

## ✅ Funcionalidades implementadas (MVP)

### Core de reputação
- **Groovium Heart** — painel vivo da reputação musical
- **Proof of Support Oracle** — workflow Chainlink CRE + Solana Devnet
- **Reputation Score (0–1000)** com 8 ranks (Rookie → Genesis Icon)
- **Oracle History** — histórico completo de sincronizações
- **Oracle Explorer** — exploração pública das provas geradas
- **IA Comportamental** — análise contínua do perfil do usuário
- **Smart Actions** — ações sugeridas pela IA com impacto na reputação
- **Sistema de reputação verificável** ponta-a-ponta

### Plataforma
- **Wallet** GRVM (saldo, histórico, transações)
- **Ranking** global e por categoria
- **Missões** (fã / músico) com bônus de boas-vindas
- **NFTs da Comunidade, Grails e Artistas** (universo visual Groovium Cyberpunk)
- **Marketplace MVP** (modo institucional — compras reais em validação)
- **Experiências** e drops ao vivo
- **Boosts** e **Crates** com recompensas dinâmicas
- **Clube VIP** com benefícios premium
- **AI Groovium** (chat e recomendações via Lovable AI Gateway)

---

## 🧭 Como funciona

```text
Usuário interage
        ↓
   Smart Actions
        ↓
   Chainlink CRE
        ↓
IA analisa o perfil
        ↓
Proof of Support Oracle
        ↓
Reputation Score (0–1000)
        ↓
   GRVM Rewards
        ↓
Solana Devnet Proof (SHA-256 memo)
```

---

## 🟢 Current Status

- ✅ **MVP Online** — https://grvm.lovable.app
- ✅ **Groovium Heart** operacional
- ✅ **Proof of Support Oracle** funcionando
- ✅ **Integração Chainlink CRE** ativa
- ✅ **Provas reais na Solana Devnet** sendo registradas
- ✅ **Sistema de reputação verificável** operacional
- 🧪 **Marketplace** em modo institucional (transações financeiras em validação)

---

## 🧱 Stack

| Camada    | Tecnologia                                                          |
| --------- | ------------------------------------------------------------------- |
| Frontend  | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui             |
| Design    | Cyberpunk · Orbitron + Exo 2 · neon blue `#00D4FF` / pink `#FF2D95` |
| Backend   | Lovable Cloud (Supabase) · Postgres · RLS · Edge Functions          |
| IA        | Lovable AI Gateway (Google Gemini)                                  |
| Web3      | Solana Devnet · Memo Program · Chainlink CRE workflow               |
| Auth      | Email/senha · Google OAuth                                          |
| Deploy    | Lovable (frontend + edge functions automáticos)                     |

---

## 📁 Estrutura

```text
groovium/
├── chainlink-cre/          # Chainlink CRE workflow (Groove Oracle)
│   ├── workflows/          # groove-oracle.yaml
│   ├── oracle/             # score.js · solana-proof.js
│   ├── prompts/            # System prompt da IA do oracle
│   └── scripts/            # generate-wallet · simulate
├── supabase/
│   ├── functions/          # Edge Functions (ai-groovium · oracle-analyze · premium-proof-sync)
│   ├── migrations/         # SQL migrations versionadas
│   └── config.toml
├── src/
│   ├── components/         # UI da landing + app autenticado (incl. Groovium Heart, Oracle Panel)
│   ├── pages/              # Rotas (Index, Login, Signup, /app/*)
│   ├── integrations/       # Supabase client (auto-gerado)
│   ├── hooks/              # useAuth, useScrollReveal, etc
│   └── lib/                # solana, oracle, boosts, crates, missions, levels, marketplace
├── public/                 # Assets estáticos
└── index.html
```

---

## 🚀 Rodando localmente

```bash
# 1. Clonar
git clone https://github.com/vtrgalves/grvm.git
cd grvm

# 2. Instalar
bun install   # ou npm install

# 3. Configurar env
cp .env.example .env
# preencher VITE_SUPABASE_* (Lovable Cloud injeta automaticamente no editor)

# 4. Rodar
bun dev
```

App disponível em `http://localhost:8080`.

---

## 🔗 Chainlink CRE — Proof of Support Oracle

Workflow híbrido que calcula o **Reputation Score (Groove Score)** e ancora um hash
**SHA-256** como prova on-chain na **Solana Devnet** via Memo Program.

```text
[ Supabase metrics ] ─┐
[ CoinGecko / MBrainz ] ─┤─► [ Reputation Score ] ─► [ Lovable AI ] ─► [ Solana Memo TX ] ─► [ oracle_activity ]
```

Detalhes em [`chainlink-cre/README.md`](./chainlink-cre/README.md).

---

## 🛡️ Segurança

- RLS habilitado em todas as tabelas `public.*`
- Roles em tabela isolada (`user_roles`) com `has_role()` security definer
- Chaves privadas Solana **apenas** em edge functions (nunca no client)
- Anon key publicável; service_role nunca exposta

---

## 🗺️ Roadmap

### ✅ Fase atual — Reputation Infrastructure (LIVE)
- Groovium Heart
- Proof of Support Oracle
- Chainlink CRE
- IA Comportamental
- Solana Devnet anchoring
- Reputation Score + 8 ranks

### 🔜 Próximas fases
- **Economia GRVM real** (transações financeiras destravadas)
- **Marketplace completo** (compra/venda end-to-end)
- **Experiências tokenizadas**
- **Camada de reputação para artistas** (perfil + métricas verificáveis)
- **NFTs migradas para infraestrutura Solana** (mainnet)
- **Mundo físico** — parcerias com festivais (Rock in Rio · Lollapalooza)

---

## 📝 Licença

Projeto proprietário © 2026 Groovium. Todos os direitos reservados.

---

**Construído com 💙 e 💗 no [Lovable](https://lovable.dev).**

---

## 🔐 Security Architecture

O Groovium foi endurecido para ficar **público no GitHub com segurança**:

### Secrets & chaves
- Apenas a **anon/publishable key** do Supabase está no frontend (`VITE_SUPABASE_PUBLISHABLE_KEY`). É segura por design.
- `service_role`, `SOLANA_PRIVATE_KEY`, `LOVABLE_API_KEY` e demais segredos vivem **somente em Lovable Cloud Secrets** (env vars das Edge Functions). Nunca tocam o bundle do cliente.
- `.gitignore` bloqueia `.env`, `*.key`, `*.pem`, `wallet*.json`, `solana-keypair*.json`.

### Autenticação
- **Supabase Auth** com Email/Password + **Google OAuth** (Lovable Cloud Managed Social Login).
- Sessões em `localStorage` com auto refresh; tokens validados server-side em todas as edge functions via `supabase.auth.getClaims(jwt)`.
- Nenhuma checagem de privilégio acontece no cliente.

### Banco de dados
- **RLS habilitado em todas as tabelas** do schema `public`.
- Policies são `authenticated`-only e escopadas por `auth.uid()` (owner-only onde apropriado: `point_transactions`, `crate_openings`, `notifications`, `oracle_activity`, `daily_checkins`, `engagement_metrics`, `user_boosts`, etc.).
- Tabela `service_config` (que guarda a keypair Solana do backend) tem **DENY ALL** para anon e authenticated; só `service_role` lê.
- Funções `SECURITY DEFINER` tiveram `EXECUTE` revogado de `PUBLIC`/`anon`; apenas usuários logados podem chamar os RPCs do app.

### Edge Functions
- `oracle-analyze` e `ai-groovium` validam JWT manualmente e usam `service_role` somente no servidor.
- Rate limiting básico (cooldowns/timestamps) no IA gateway.
- Logs não imprimem JWTs, emails ou payloads sensíveis — apenas status de workflow e chaves públicas Solana.

### Solana / Chainlink
- A wallet de serviço fica em `service_config` (RLS deny-all) ou em `SOLANA_PRIVATE_KEY`.
- Memos on-chain contêm apenas: `reputation_score`, `oracle_hash`, `rank`, `timestamp`. **Nunca** email, nome ou dados pessoais.
- `tx_hash` e `explorer_url` são públicos por natureza.

### Privacidade
- Email do usuário acessível **somente** ao próprio dono via `get_my_email()`.
- Perfis públicos expõem apenas `name`, `handle`, `photo_url`, `bio`, `level`, `grv_points`.

> 🎧 *Secure the frequency.*
