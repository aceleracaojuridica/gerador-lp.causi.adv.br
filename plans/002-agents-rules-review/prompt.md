## Contexto do Projeto

**O que é:** SaaS vertical para advogados brasileiros.
CRM Kanban + Inbox WhatsApp + Agente IA + Follow-up automático.

**Stack:**
- Next.js 16+ (App Router)
- Supabase (Postgres, Auth, RLS, Realtime, Edge Functions, Storage)
- Hospedagem: Vercel + Supabase Cloud
- Gerenciador de pacotes: `pnpm`

**Documentação do projeto:** @docs/README.md  
**Readme padrão do repositório:** @README.md  

---

## Objetivo

Auditar e melhorar os arquivos de configuração de agentes IA para otimizar o fluxo de AI-driven development no projeto.

---

## Fase 1 — Revisão do @AGENTS.md do repositório 

Pesquise as melhores práticas atuais para arquivos de instrução de agentes IA consultando:
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://www.aihero.dev/a-complete-guide-to-agents-md
- https://www.philschmid.de/writing-good-agents

Com base nisso e no contexto real do projeto em `/docs`, reescreva o `AGENTS.md` da raiz.

---

## Fase 2 — Revisão dos arquivos em @.agents/rules/ 

Leia a documentação atual em `/docs` e audite cada arquivo em `.agents/rules/`. Para cada um, decida e justifique: manter, simplificar para referência, alterar ou remover.

---

## Processo

- Antes de cada fase, salve seu plano em `/plans/agents-rules-review/`
- Ao final, salve um resumo do que foi feito em `/plans/agents-rules-review/README.md`