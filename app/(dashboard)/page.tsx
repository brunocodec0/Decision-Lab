import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Busca dados financeiros mais recentes
  const { data: financial } = await supabase
    .from("v_latest_financial")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  // Busca últimos 6 meses para o gráfico
  const { data: history } = await supabase
    .from("financial_data")
    .select("reference_month, monthly_revenue, monthly_costs, cash_balance")
    .eq("user_id", user!.id)
    .order("reference_month", { ascending: false })
    .limit(6);

  // Busca decisões em análise
  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, name, decision_score, status, recurring_cost, expected_return")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      financial={financial}
      history={(history || []).reverse()}
      decisions={decisions || []}
    />
  );
}
