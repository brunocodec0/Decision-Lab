# DecisionLab AI — Iniciativa Consultoria

> Plataforma SaaS de apoio à tomada de decisões estratégicas, desenvolvida para o time Jurídico-Financeiro da Iniciativa Consultoria (UERJ).

🔗 **[Acessar plataforma](https://decisionlab-iniciativa.vercel.app)**

---

## 💡 O Problema

Times financeiros de empresas juniores tomam decisões de investimento sem dados estruturados, sem histórico e sem uma visão clara de impacto. O processo é manual, subjetivo e difícil de rastrear.

## 🚀 A Solução

O DecisionLab centraliza dados financeiros reais e aplica um algoritmo proprietário (**Decision Score**) para pontuar e comparar decisões estratégicas automaticamente — com suporte de IA consultora integrada.

---

## ✨ Funcionalidades

- **Dashboard executivo** — visão em tempo real do caixa, receita, custos e runway
- **Simulador de decisões** — registro e pontuação de investimentos via Decision Score (0–100)
- **Projeção de cenários** — análise pessimista, realista e otimista
- **IA Consultora** — chat com contexto financeiro real integrado (Claude Haiku)
- **Histórico de decisões** — rastreabilidade completa com audit trail

---

## 🛠️ Stack

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Anthropic](https://img.shields.io/badge/Claude_Haiku-D4A574?style=flat)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Backend:** API Routes (Next.js) + Supabase (PostgreSQL + RLS)
- **IA:** Anthropic Claude Haiku com contexto financeiro dinâmico
- **Auth:** Supabase Auth
- **Deploy:** Vercel (free tier)
- **Custo total:** R$ 0

---

## 🏗️ Arquitetura

```
app/
  (auth)/login/         → Autenticação
  (dashboard)/
    page.tsx            → Dashboard executivo
    simulator/          → Simulador + Decision Score
    scenarios/          → Projeção de cenários
    ai-advisor/         → Chat com IA consultora
    history/            → Histórico de decisões
  api/
    decisions/          → CRUD de decisões
    financial/          → Dados financeiros
    ai-advisor/         → Integração Anthropic

lib/
  supabase/             → Clients SSR
  calculations/score.ts → Algoritmo Decision Score
```

---

## ⚙️ Variáveis de Ambiente

Para rodar localmente, crie um `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
ANTHROPIC_API_KEY=sua_chave_anthropic
```

> ⚠️ Nunca commite o `.env.local`. As variáveis de produção são configuradas diretamente no Vercel.

---

## 📌 Contexto

Projeto desenvolvido durante a gestão como **Diretor de Pesquisa & Inovação** da [Iniciativa Consultoria](https://www.linkedin.com/company/iniciativa-consultoria/) — empresa júnior de Administração da UERJ.

Construído inteiramente com ferramentas gratuitas, do zero, sem orçamento.

---

*Desenvolvido por [Bruno Codeco](https://www.linkedin.com/in/seu-perfil/) · 2025*
