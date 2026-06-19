"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const C = {
  brand:"#690a96", accent:"#50d9c9", card:"#141420", border:"#1e1e32",
  text:"#f1f0f5", textMid:"#94a3b8", textDim:"#475569",
  green:"#50d9c9", yellow:"#f59e0b", red:"#ef4444", surface:"#0f0f18",
};

const fmt  = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtK = (v: number) => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : fmt(v);

function KPI({ title, value, sub, accent }: any) {
  return (
    <div style={{ background:C.card, border:`1px solid ${accent?C.brand+"60":C.border}`,
      borderRadius:10, padding:"16px 18px",
      boxShadow: accent?`0 0 20px ${C.brand}14`:"none" }}>
      <p style={{ fontSize:10, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 7px" }}>{title}</p>
      <p style={{ fontSize:20, fontWeight:700, color:accent?C.accent:C.text, margin:"0 0 3px", letterSpacing:-.5 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:C.textDim, margin:0 }}>{sub}</p>}
    </div>
  );
}

const TT = ({ active, payload, label }: any) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color:C.textMid, marginBottom:5, fontWeight:600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color:p.color, margin:"2px 0" }}>{p.name}: {fmtK(p.value)}</p>
      ))}
    </div>
  );
};

function FinancialForm({ onSave }: { onSave: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  // Dados reais da Iniciativa pré-preenchidos
  const [form, setForm] = useState({
    cash_balance: "68.20",
    monthly_revenue: "0",
    monthly_costs: "225",
    operational_reserve: "0",
    reference_month: new Date().toISOString().slice(0,7),
    notes: "",
  });

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("financial_data").upsert([{
      user_id: user.id,
      reference_month: form.reference_month + "-01",
      cash_balance: +form.cash_balance,
      monthly_revenue: +form.monthly_revenue,
      monthly_costs: +form.monthly_costs,
      operational_reserve: +form.operational_reserve,
      notes: form.notes,
    }], { onConflict: "user_id,reference_month" });

    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Dados financeiros salvos!");
    onSave();
  };

  const inp = (label: string, key: string, type="number") => (
    <div>
      <label style={{ fontSize:11, color:C.textDim, display:"block", marginBottom:4, fontWeight:600, letterSpacing:.4 }}>{label}</label>
      <input type={type} value={(form as any)[key]}
        onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
        style={{ width:"100%", padding:"9px 12px" }}/>
    </div>
  );

  return (
    <div style={{ background:C.card, border:`1px solid ${C.brand}40`, borderRadius:12, padding:22, marginBottom:24 }}>
      <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 4px" }}>Atualizar Dados Financeiros</p>
      <p style={{ fontSize:11, color:C.textDim, margin:"0 0 18px" }}>Preencha com os dados reais do mês atual da Iniciativa</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
        <div>
          <label style={{ fontSize:11, color:C.textDim, display:"block", marginBottom:4, fontWeight:600, letterSpacing:.4 }}>Mês de referência</label>
          <input type="month" value={form.reference_month}
            onChange={e=>setForm(f=>({...f,reference_month:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px" }}/>
        </div>
        {inp("Caixa atual (R$)","cash_balance")}
        {inp("Receita mensal (R$)","monthly_revenue")}
        {inp("Custos mensais (R$)","monthly_costs")}
        {inp("Reserva operacional (R$)","operational_reserve")}
        <div>
          <label style={{ fontSize:11, color:C.textDim, display:"block", marginBottom:4, fontWeight:600, letterSpacing:.4 }}>Observações</label>
          <input type="text" value={form.notes} placeholder="Ex: mês de transição"
            onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px" }}/>
        </div>
      </div>
      <button onClick={save} disabled={saving} style={{
        marginTop:16, background:C.brand, color:"#fff", border:"none", borderRadius:8,
        padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity:saving?.6:1,
      }}>{saving?"Salvando...":"Salvar dados"}</button>
    </div>
  );
}

export default function DashboardClient({ financial, history, decisions }: any) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(!financial);

  const profit = financial ? financial.monthly_revenue - financial.monthly_costs : -225;
  const runway = financial?.monthly_costs > 0
    ? (financial.cash_balance / financial.monthly_costs).toFixed(1)
    : "—";

  const chartData = history.length > 0
    ? history.map((h: any) => ({
        mes: new Date(h.reference_month).toLocaleDateString("pt-BR",{month:"short"}),
        lucro: h.monthly_revenue - h.monthly_costs,
        caixa: h.cash_balance,
      }))
    : [{ mes:"Jun", lucro:-225, caixa:68.20 }];

  const alertColor = profit < 0 ? C.red : C.green;
  const alertIcon  = profit < 0 ? "⚠️" : "✅";
  const alertMsg   = profit < 0
    ? `Operação atual com déficit de ${fmt(Math.abs(profit))}/mês — decisões de redução de custo ou geração de receita são prioritárias`
    : `Operação saudável com lucro de ${fmt(profit)}/mês`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:19, fontWeight:700, color:C.text, margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:12, color:C.textDim, margin:"3px 0 0" }}>
            Iniciativa Consultoria · {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
          </p>
        </div>
        <button onClick={()=>setShowForm(f=>!f)} style={{
          background:"transparent", border:`1px solid ${C.border}`, borderRadius:8,
          padding:"7px 14px", fontSize:12, color:C.textMid, cursor:"pointer",
        }}>
          {showForm?"Fechar":"Atualizar dados"}
        </button>
      </div>

      {showForm && <FinancialForm onSave={()=>{ setShowForm(false); router.refresh(); }}/>}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KPI title="Caixa atual"     value={fmt(financial?.cash_balance ?? 68.20)}        sub="disponível"           accent/>
        <KPI title="Lucro mensal"    value={fmt(profit)}                                   sub={profit<0?"déficit":"margem positiva"}/>
        <KPI title="Custos mensais"  value={fmt(financial?.monthly_costs ?? 225)}          sub="Meta Ads + Telefone"/>
        <KPI title="Runway"          value={`${runway} meses`}                             sub="sem receita nova"/>
      </div>

      {/* Alerta */}
      <div style={{ background:alertColor+"0e", border:`1px solid ${alertColor}30`,
        borderRadius:10, padding:"13px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
        <span style={{ fontSize:16, flexShrink:0 }}>{alertIcon}</span>
        <p style={{ fontSize:12, color:C.textMid, margin:0, lineHeight:1.6 }}>{alertMsg}</p>
      </div>

      {/* Gráfico */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 20px 12px" }}>
        <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:"0 0 4px" }}>Evolução Financeira</p>
        <p style={{ fontSize:11, color:C.textDim, margin:"0 0 18px" }}>Lucro e caixa ao longo do tempo</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={.2}/>
                <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.brand} stopOpacity={.2}/>
                <stop offset="95%" stopColor={C.brand} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="mes" tick={{ fill:C.textDim, fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>`${v}`} tick={{ fill:C.textDim, fontSize:10 }} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="caixa" name="Caixa" stroke={C.brand} fill="url(#gB)" strokeWidth={2} dot={false}/>
            <Area type="monotone" dataKey="lucro" name="Lucro" stroke={C.accent} fill="url(#gA)" strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Decisões recentes */}
      {decisions.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}` }}>
            <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>Decisões em Análise</p>
          </div>
          {decisions.map((d: any) => {
            const score = d.decision_score ?? 0;
            const col   = score>=70?C.green:score>=40?C.yellow:C.red;
            return (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:14,
                padding:"12px 18px", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0,
                  background:col+"18", border:`2px solid ${col}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, color:col }}>{Math.round(score)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{d.name}</p>
                  <p style={{ fontSize:11, color:C.textDim, margin:0 }}>
                    Custo: {fmt(d.recurring_cost)}/mês · Retorno: {fmt(d.expected_return)}/mês
                  </p>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                  background:col+"18", color:col, border:`1px solid ${col}35` }}>
                  {d.status==="approved"?"Aprovado":d.status==="rejected"?"Rejeitado":"Em análise"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
