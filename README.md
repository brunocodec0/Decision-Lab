# DecisionLab AI — Iniciativa Consultoria

Plataforma de apoio à tomada de decisões estratégicas do Jurídico Financeiro.

---

## SETUP EM 5 PASSOS

### 1. Banco de dados (Supabase) — já configurado

A URL e a Anon Key já estão no `.env.local`.

**Rode o SQL:** Abra o arquivo `iniciativa-sql.sql` no SQL Editor do Supabase e clique em **Run**.

### 2. Clone e instale

```bash
# Clonar (ou descompactar o zip)
cd decisionlab-ai

# Instalar dependências
npm install
```

### 3. Configure a chave da OpenAI

No arquivo `.env.local`, substitua:
```
OPENAI_API_KEY=sk-COLE_SUA_CHAVE_AQUI
```
pela sua chave real de **platform.openai.com → API Keys**.

### 4. Rode localmente

```bash
npm run dev
# Acesse: http://localhost:3000
```

### 5. Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Quando perguntar sobre variáveis de ambiente, confirme as do .env.local
# OU configure manualmente em: vercel.com → seu projeto → Settings → Environment Variables
```

---

## PRIMEIROS PASSOS NO SISTEMA

1. Acesse `/login` → clique em **Criar conta** → cadastre os 5 membros do J. Financeiro
2. Faça login com o primeiro usuário
3. No **Dashboard** → clique em **Atualizar dados** → confirme os dados da Iniciativa:
   - Caixa: R$ 68,20
   - Receita mensal: R$ 0
   - Custos mensais: R$ 225
   - Reserva operacional: R$ 0
4. Vá ao **Simulador** → registre as decisões em análise:
   - Meta Ads: custo R$ 110/mês, retorno a estimar
   - Telefone: custo R$ 9/mês (já incluso nos custos mensais)

---

## ESTRUTURA DO PROJETO

```
app/
  (auth)/login/         → Tela de login/cadastro
  (dashboard)/
    page.tsx            → Dashboard executivo
    simulator/          → Simulador de decisões + Decision Score
    scenarios/          → Projeções pessimista/realista/otimista
    ai-advisor/         → Chat com IA consultora (OpenAI)
    history/            → Histórico de todas as decisões
  api/
    decisions/          → CRUD de decisões
    financial/          → Dados financeiros
    ai-advisor/         → Integração OpenAI

lib/
  supabase/             → Clients browser e server
  calculations/score.ts → Algoritmo Decision Score

components/
  layout/Sidebar.tsx    → Navegação lateral
```

---

## USUÁRIOS — CADASTRO DOS 5 MEMBROS

Cada membro do J. Financeiro deve:
1. Acessar o link do sistema
2. Clicar em **Criar conta**
3. Informar nome e e-mail institucional

Todos verão as mesmas decisões (política de equipe pequena via RLS).

---

## VARIÁVEIS DE AMBIENTE (Vercel)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mmlnakbimzxyewaaggfs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (já no .env.local) |
| `OPENAI_API_KEY` | `sk-...` (obter em platform.openai.com) |

---

## DECISÕES PRÉ-CADASTRADAS

Assim que logar pela primeira vez, adicione no Simulador:

| Decisão | Categoria | Custo único | Custo/mês | Retorno/mês |
|---|---|---|---|---|
| Meta Ads | Marketing | R$ 0 | R$ 110 | A definir |
| Linha telefônica | Serviço | R$ 0 | R$ 9 | A definir |
