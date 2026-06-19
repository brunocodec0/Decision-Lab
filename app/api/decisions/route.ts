import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcScore } from "@/lib/calculations/score";
import { z } from "zod";

const Schema = z.object({
  name:               z.string().min(1),
  category:           z.string().default("other"),
  one_time_cost:      z.number().min(0).default(0),
  recurring_cost:     z.number().min(0).default(0),
  expected_return:    z.number().min(0).default(0),
  return_start_month: z.number().int().min(1).default(1),
  observations:       z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { data, error } = await supabase
    .from("v_decisions_calculated")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending:false });

  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error:parsed.error.flatten() }, { status:400 });

  // Busca dados financeiros pra calcular score
  const { data: fin } = await supabase
    .from("v_latest_financial")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let decision_score = null;
  let score_breakdown = null;

  if (fin) {
    const sc = calcScore(
      { cashBalance: fin.cash_balance, monthlyRevenue: fin.monthly_revenue,
        monthlyCosts: fin.monthly_costs, operationalReserve: fin.operational_reserve },
      { oneTimeCost: parsed.data.one_time_cost, recurringCost: parsed.data.recurring_cost,
        expectedReturn: parsed.data.expected_return, returnStartMonth: parsed.data.return_start_month }
    );
    decision_score  = sc.total;
    score_breakdown = sc;
  }

  const { data, error } = await supabase
    .from("decisions")
    .insert([{ ...parsed.data, user_id:user.id, status:"analyzing", decision_score, score_breakdown }])
    .select()
    .single();

  if (error) return NextResponse.json({ error:error.message }, { status:500 });

  await supabase.from("decision_history").insert([{
    decision_id: data.id, user_id: user.id,
    action:"created", new_values: data,
  }]);

  return NextResponse.json(data, { status:201 });
}
