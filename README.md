# Groovium (GRVM) 🎵

> **Groovium é um ecossistema que conecta artistas e fãs.**
> A próxima geração da economia musical — gamificada, descentralizada e movida por reputação on-chain.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-FF2D95?style=for-the-badge)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18-00D4FF?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Chainlink](https://img.shields.io/badge/Chainlink-CRE-375BD2?style=for-the-badge&logo=chainlink&logoColor=white)](https://chain.link)
[![Supabase](https://img.shields.io/badge/Lovable%20Cloud-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

---

## 🌐 Live

- **Produção:** https://grvm.lovable.app
- **Domínios oficiais:** https://groovium.life · https://www.groovium.life

---

## ✨ Sobre

Groovium é um **ecossistema musical Web3** que une fãs, artistas, IA e reputação on-chain.
A plataforma transforma engajamento em **Groove Score** — uma reputação verificável ancorada
on-chain na **Solana Devnet** via **Chainlink CRE (Hybrid Oracle)**.

### Principais pilares

- 🎮 **Gamificação real** — pontos GRVM, missões, boosts, crates, NFTs e ranking
- 🤖 **IA Groovium** — recomendações e insights via Lovable AI Gateway (Gemini)
- 🔗 **Proof of Support Oracle** — Chainlink CRE + Solana Devnet
- 🎧 **Carreira musical descentralizada** — artistas monetizam com fãs reais
- 🏆 **Roadmap startup Web3** — evolução clara até parcerias com festivais (Rock in Rio, Lollapalooza)

---

## 🧱 Stack

| Camada       | Tecnologia                                                         |
| ------------ | ------------------------------------------------------------------ |
| Frontend     | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui            |
| Design       | Cyberpunk · Orbitron + Exo 2 · neon blue `#00D4FF` / pink `#FF2D95`|
| Backend      | Lovable Cloud (Supabase) · Postgres · RLS · Edge Functions         |
| IA           | Lovable AI Gateway (Google Gemini)                                 |
| Web3         | Solana Devnet · Memo Program · Chainlink CRE workflow              |
| Auth         | Email/senha · Google OAuth                                         |
| Deploy       | Lovable (frontend + edge functions automáticos)                    |

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
│   ├── functions/          # Edge Functions (ai-groovium · oracle-analyze)
│   ├── migrations/         # SQL migrations versionadas
│   └── config.toml
├── src/
│   ├── components/         # UI da landing + app autenticado
│   ├── pages/              # Rotas (Index, Login, Signup, /app/*)
│   ├── integrations/       # Supabase client (auto-gerado)
│   ├── hooks/              # useAuth, useScrollReveal, etc
│   └── lib/                # solana, boosts, crates, missions, levels
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

Workflow híbrido que calcula um **Groove Score** (reputação Web2) e ancora um hash
**SHA-256** como prova on-chain na **Solana Devnet** via Memo Program.

```text
[ Supabase metrics ] ─┐
[ CoinGecko / MBrainz ] ─┤─► [ Groove Score ] ─► [ Lovable AI ] ─► [ Solana Memo TX ] ─► [ oracle_activity ]
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

1. ✅ **Plataforma BETA** — GRVM, missões, NFTs, Groove Score, IA
2. ⚡ **Expansão Web3** — Proof of Support Oracle (Chainlink + Solana)
3. ◎ **Token GRVM** — economia on-chain, wallets, NFTs
4. 🚀 **Monetização** — marcas, creators, festivais
5. 🌎 **Mundo físico** — Rock in Rio · Lollapalooza

---

## 📝 Licença

Projeto proprietário © 2026 Groovium. Todos os direitos reservados.

---

**Construído com 💙 e 💗 no [Lovable](https://lovable.dev).**
