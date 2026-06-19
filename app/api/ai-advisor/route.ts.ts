import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, decisionId, history = [] } = await req.json();

  // Dados financeiros reais
  const { data: fin } = await supabase
    .from("v_latest_financial")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Dados da decisão selecionada (se houver)
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

Seu papel é agir como consultora estratégica experiente em finanças e gestão, orientando a equipe do Jurídico Financeiro.

SITUAÇÃO FINANCEIRA REAL DA INICIATIVA:
${fin ? `
- Caixa disponível: ${fmt(fin.cash_balance)}
- Receita mensal: ${fmt(fin.monthly_revenue)}
- Custos mensais: ${fmt(fin.monthly_costs)}
- Lucro/déficit mensal: ${fmt(fin.monthly_profit)}
- Reserva operacional: ${fmt(fin.operational_reserve)}
- Runway estimado: ${fin.sustainability_months ?? "calculando"} meses` : "- Dados financeiros ainda não cadastrados"}
${decisionCtx}

CONTEXTO:
- Iniciativa Consultoria é uma empresa júnior universitária (UERJ), sem fins lucrativos
- Custos atuais: Meta Ads (R$ 110/mês) + Telefone (R$ 9/mês)
- Receita atual é zero — fase de retomada

REGRAS:
1. Use SEMPRE os dados reais acima — nunca seja genérico
2. Seja direta e objetiva — máximo 200 palavras
3. Justifique recomendações com números reais
4. Considere o contexto de empresa júnior (recursos escassos, equipe voluntária)
5. Responda em português brasileiro
6. Priorize recomendações práticas e acionáveis`;

  try {
    const messages: Anthropic.MessageParam[] = [
      ...history.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Salva conversa no banco
    await supabase.from("ai_conversations").insert([{
      user_id: user.id,
      decision_id: decisionId || null,
      messages: [
        ...history,
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
      context_data: fin,
    }]);

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
