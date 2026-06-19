import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const fmt = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { message, decisionId, history = [] } = await req.json();

  // Dados financeiros reais
  const { data: fin } = await supabase
    .from("v_latest_financial")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Dados da decisão (se informada)
  let decisionCtx = "";
  if (decisionId) {
    const { data: dec } = await supabase
      .from("v_decisions_calculated")
      .select("*")
      .eq("id", decisionId)
      .single();
    if (dec) {
      decisionCtx = `
DECISÃO EM ANÁLISE: ${dec.name}
- Categoria: ${dec.category}
- Custo único: ${fmt(dec.one_time_cost)}
- Custo recorrente/mês: ${fmt(dec.recurring_cost)}
- Retorno esperado/mês: ${fmt(dec.expected_return)}
- Decision Score: ${Math.round(dec.decision_score ?? 0)}/100
- ROI anual estimado: ${dec.roi_percent?.toFixed(0) ?? "N/A"}%
- Break-even: ${dec.breakeven_months ?? "N/A"} meses
- Status: ${dec.status}`;
    }
  }

  const systemPrompt = `Você é a IA Consultora do DecisionLab, da Iniciativa Consultoria (empresa júnior da UERJ).

Seu papel é agir como consultora estratégica experiente em finanças e gestão, orientando a equipe do Jurídico Financeiro da Iniciativa.

SITUAÇÃO FINANCEIRA REAL DA INICIATIVA:
${fin ? `
- Caixa disponível: ${fmt(fin.cash_balance)}
- Receita mensal: ${fmt(fin.monthly_revenue)}
- Custos mensais: ${fmt(fin.monthly_costs)}
- Lucro/déficit mensal: ${fmt(fin.monthly_profit)}
- Reserva operacional: ${fmt(fin.operational_reserve)}
- Runway estimado: ${fin.sustainability_months ?? "calculando"} meses` : "- Dados financeiros ainda não cadastrados no sistema"}
${decisionCtx}

CONTEXTO ADICIONAL:
- Iniciativa Consultoria é uma empresa júnior universitária (UERJ), sem fins lucrativos
- Custos atuais: Meta Ads (R$ 110/mês) + Telefone (R$ 9/mês) = R$ 225/mês de estrutura básica (não há despesas com pessoal)
- Receita atual é zero — a empresa está em fase de retomada

INSTRUÇÕES:
1. Use SEMPRE os dados reais acima — nunca seja genérico
2. Seja direta e objetiva — máximo 200 palavras
3. Quando recomendar ou contra-indicar, justifique com números reais
4. Considere o contexto de empresa júnior (recursos escassos, equipe voluntária)
5. Responda em português brasileiro
6. Priorize recomendações práticas e acionáveis`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        { role:"system", content:systemPrompt },
        ...history,
        { role:"user", content:message },
      ],
    });

    const reply = completion.choices[0].message.content ?? "";

    // Salva conversa
    await supabase.from("ai_conversations").insert([{
      user_id: user.id,
      decision_id: decisionId || null,
      messages: [...history, { role:"user", content:message }, { role:"assistant", content:reply }],
      context_data: fin,
    }]);

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
