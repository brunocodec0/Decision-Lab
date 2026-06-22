"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const C = {
  brand:"#690a96", accent:"#50d9c9", card:"#141420", border:"#1e1e32",
  text:"#f1f0f5", textMid:"#94a3b8", textDim:"#475569",
  green:"#50d9c9", yellow:"#f59e0b", red:"#ef4444", surface:"#0f0f18",
};

const fmt  = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtK = (v: number) => Math.abs(v) >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : fmt(v);

// ── Custo anual individual ─────────────────────────────────────
interface AnnualCost { id: number; name: string; amount: string; due_date: string; }

function AnnualCostsSection({
  costs, setCosts,
}: {
  costs: AnnualCost[];
  setCosts: React.Dispatch<React.SetStateAction<AnnualCost[]>>;
}) {
  const add = () => setCosts(p => [...p, { id: Date.now(), name: "", amount: "", due_date: "" }]);
  const upd = (id: number, k: keyof AnnualCost, v: string) =>
    setCosts(p => p.map(c => c.id === id ? { ...c, [k]: v } : c));
  const del = (id: number) => setCosts(p => p.filter(c => c.id !== id));

  return (
    <div style={{ gridColumn:"1/-1" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <label style={{ fontSize:11, color:C.textDim, fontWeight:600, letterSpacing:.4 }}>
          CUSTOS ANUAIS (plataformas, assinaturas, renovações)
        </label>
        <button onClick={add} style={{
          background:C.brand+"20", color:C.accent, border:`1px solid ${C.brand}40`,
          borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer",
        }}>+ Adicionar</button>
      </div>

      {costs.length === 0 && (
        <p style={{ fontSize:11, color:C.textDim, fontStyle:"italic" }}>
          Nenhum custo anual cadastrado. Clique em + Adicionar para incluir.
        </p>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {costs.map(c => (
          <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 140px 150px 32px", gap:8, alignItems:"center" }}>
            <input placeholder="Nome (ex: Google Workspace)" value={c.name}
              onChange={e => upd(c.id, "name", e.target.value)}
              style={{ padding:"8px 10px", fontSize:12 }}/>
            <input type="number" placeholder="Valor (R$)" value={c.amount}
              onChange={e => upd(c.id, "amount", e.target.value)}
              style={{ padding:"8px 10px", fontSize:12 }}/>
            <input type="date" value={c.due_date}
              onChange={e => upd(c.id, "due_date", e.target.value)}
              style={{ padding:"8px 10px", fontSize:12 }}/>
            <button onClick={() => del(c.id)} style={{
              background:C.red+"15", color:C.red, border:`1px solid ${C.red}30`,
              borderRadius:6, padding:"6px", fontSize:13, cursor:"pointer", lineHeight:1,
            }}>×</button>
          </div>
        ))}
      </div>

      {costs.length > 0 && (
        <p style={{ fontSize:11, color:C.textDim, marginTop:8 }}>
          Total anual: <b style={{ color:C.text }}>{fmt(costs.reduce((a,c) => a + (+c.amount||0), 0))}</b>
          {" "}· Equivale a <b style={{ color:C.text }}>{fmt(costs.reduce((a,c) => a + (+c.amount||0), 0)/12)}/mês</b>
        </p>
      )}
    </div>
  );
}

// ── Verba FAPERJ ──────────────────────────────────────────────
const FAPERJ_TOTAL = 58600;
const FAPERJ_USED  = 2557.32;
const FAPERJ_BALANCE = FAPERJ_TOTAL - FAPERJ_USED;

// Itens do edital aprovados (categoria · nome · valor)
const FAPERJ_ITEMS = [
  // Prospecção
  { cat:"Prospecção", name:"Google Ads",   value:2000, recurrent:true  },
  { cat:"Prospecção", name:"LinkedIn Ads", value:1000, recurrent:true  },
  { cat:"Prospecção", name:"Meta Ads",     value:500,  recurrent:true  },
  // Site
  { cat:"Site",       name:"Reformulação do site", value:7200, recurrent:false },
  // Ferramentas
  { cat:"Ferramentas", name:"Canva Pro",   value:300,  recurrent:false },
  { cat:"Ferramentas", name:"Lightroom",   value:1140, recurrent:false },
  { cat:"Ferramentas", name:"CapCut Pro",  value:234.90, recurrent:false },
  { cat:"Ferramentas", name:"RD Station",  value:300,  recurrent:true  },
  // Equipamentos
  { cat:"Equipamentos", name:"Computador",         value:7000,  recurrent:false },
  { cat:"Equipamentos", name:"Celular",             value:5000,  recurrent:false },
  { cat:"Equipamentos", name:"Câmera profissional", value:5000,  recurrent:false },
  { cat:"Equipamentos", name:"Tripé",               value:100,   recurrent:false },
  { cat:"Equipamentos", name:"Lente",               value:50,    recurrent:false },
  { cat:"Equipamentos", name:"Stand",               value:4000,  recurrent:false },
  // Cursos
  { cat:"Cursos FGV", name:"Adm. Estratégica de Vendas",  value:997.60, recurrent:false },
  { cat:"Cursos FGV", name:"Análise de Viabilidade",       value:997.60, recurrent:false },
  { cat:"Cursos FGV", name:"Excelência em Vendas B2B",     value:997.60, recurrent:false },
  { cat:"Cursos FGV", name:"Experiência do Cliente",       value:997.60, recurrent:false },
  { cat:"Cursos FGV", name:"Gestão de Projetos",           value:997.60, recurrent:false },
  { cat:"Cursos FGV", name:"Gestão de Vendas",             value:997.60, recurrent:false },
];

const FAPERJ_CATS = Array.from(new Set(FAPERJ_ITEMS.map(i => i.cat)));

function FaperjSection() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const pct = Math.round((FAPERJ_USED / FAPERJ_TOTAL) * 100);
  const filtered = filter === "Todos" ? FAPERJ_ITEMS : FAPERJ_ITEMS.filter(i => i.cat === filter);

  return (
    <div style={{ gridColumn:"1/-1", marginTop:8 }}>
      {/* Card resumo FAPERJ */}
      <div style={{ background:"#0d1f2d", border:"1px solid #50d9c940",
        borderRadius:10, padding:"16px 18px", marginBottom:open?12:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:12 }}>🏛️</span>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.accent }}>Verba FAPERJ</p>
              <span style={{ fontSize:10, color:C.textDim, padding:"1px 7px",
                background:"#50d9c915", border:"1px solid #50d9c930", borderRadius:20 }}>
                Tecnologia & Inovação
              </span>
            </div>
            <div style={{ display:"flex", gap:24 }}>
              <div>
                <p style={{ margin:0, fontSize:10, color:C.textDim }}>Total aprovado</p>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>{fmt(FAPERJ_TOTAL)}</p>
              </div>
              <div>
                <p style={{ margin:0, fontSize:10, color:C.textDim }}>Utilizado</p>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.yellow }}>{fmt(FAPERJ_USED)}</p>
              </div>
              <div>
                <p style={{ margin:0, fontSize:10, color:C.textDim }}>Saldo disponível</p>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.green }}>{fmt(FAPERJ_BALANCE)}</p>
              </div>
            </div>
            {/* Barra de uso */}
            <div style={{ marginTop:10 }}>
              <div style={{ height:4, borderRadius:4, background:C.border, width:280 }}>
                <div style={{ height:4, borderRadius:4, background:C.accent, width:`${pct}%` }}/>
              </div>
              <p style={{ margin:"4px 0 0", fontSize:10, color:C.textDim }}>{pct}% utilizado</p>
            </div>
          </div>
          <button onClick={() => setOpen(o => !o)} style={{
            background:"transparent", border:`1px solid ${C.border}`, borderRadius:7,
            padding:"5px 12px", fontSize:11, color:C.textMid, cursor:"pointer",
          }}>{open ? "Fechar" : "Ver itens do edital"}</button>
        </div>
      </div>

      {/* Lista de itens do edital */}
      {open && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {["Todos", ...FAPERJ_CATS].map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                background: filter===c ? C.accent+"25" : "transparent",
                color: filter===c ? C.accent : C.textDim,
                border: `1px solid ${filter===c ? C.accent+"50" : C.border}`,
                borderRadius:20, padding:"3px 10px", fontSize:11, cursor:"pointer",
              }}>{c}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {filtered.map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"8px 12px", background:C.surface, borderRadius:8,
                border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:10, color:C.textDim, padding:"2px 7px",
                    background:C.border, borderRadius:20 }}>{item.cat}</span>
                  <span style={{ fontSize:12, color:C.text }}>{item.name}</span>
                  {item.recurrent && (
                    <span style={{ fontSize:9, color:C.yellow, padding:"1px 6px",
                      background:C.yellow+"15", border:`1px solid ${C.yellow}30`, borderRadius:20 }}>
                      recorrente/mês
                    </span>
                  )}
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:C.accent, flexShrink:0 }}>
                  {fmt(item.value)}{item.recurrent ? "/mês" : ""}
                </span>
              </div>
            ))}
          </div>

          <p style={{ margin:"12px 0 0", fontSize:11, color:C.textDim, lineHeight:1.6 }}>
            ⚠️ Status de aprovação de cada item ainda pendente de confirmação da FAPERJ.
            Ao criar uma decisão no Simulador, você poderá marcá-la como elegível para esta verba.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Formulário financeiro ──────────────────────────────────────
function FinancialForm({ onSave }: { onSave: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [annualCosts, setAnnualCosts] = useState<AnnualCost[]>([]);
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

    // Inclui custo anual mensal no total de custos
    const annualMonthly = annualCosts.reduce((a,c) => a + (+c.amount||0), 0) / 12;
    const totalMonthlyCosts = (+form.monthly_costs || 0) + annualMonthly;

    const { error } = await supabase.from("financial_data").upsert([{
      user_id: user.id,
      reference_month: form.reference_month + "-01",
      cash_balance: +form.cash_balance,
      monthly_revenue: +form.monthly_revenue,
      monthly_costs: totalMonthlyCosts,
      operational_reserve: +form.operational_reserve,
      notes: form.notes + (annualCosts.length > 0
        ? ` | Custos anuais: ${annualCosts.map(c=>`${c.name} R$${c.amount} (venc. ${c.due_date})`).join(", ")}`
        : ""),
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
        onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
        style={{ width:"100%", padding:"9px 12px" }}/>
    </div>
  );

  return (
    <div style={{ background:C.card, border:`1px solid ${C.brand}40`, borderRadius:12, padding:22, marginBottom:24 }}>
      <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 4px" }}>Atualizar Dados Financeiros</p>
      <p style={{ fontSize:11, color:C.textDim, margin:"0 0 18px" }}>Dados reais do mês atual da Iniciativa</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
        <div>
          <label style={{ fontSize:11, color:C.textDim, display:"block", marginBottom:4, fontWeight:600, letterSpacing:.4 }}>Mês de referência</label>
          <input type="month" value={form.reference_month}
            onChange={e => setForm(f => ({...f,reference_month:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px" }}/>
        </div>
        {inp("Caixa atual (R$)", "cash_balance")}
        {inp("Receita mensal (R$)", "monthly_revenue")}
        {inp("Custos mensais recorrentes (R$)", "monthly_costs")}
        {inp("Reserva operacional (R$)", "operational_reserve")}
        <div>
          <label style={{ fontSize:11, color:C.textDim, display:"block", marginBottom:4, fontWeight:600, letterSpacing:.4 }}>Observações</label>
          <input type="text" value={form.notes} placeholder="Ex: mês de transição"
            onChange={e => setForm(f => ({...f,notes:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px" }}/>
        </div>

        {/* Custos anuais */}
        <AnnualCostsSection costs={annualCosts} setCosts={setAnnualCosts}/>

        {/* Verba FAPERJ */}
        <FaperjSection/>
      </div>

      <button onClick={save} disabled={saving} style={{
        marginTop:16, background:C.brand, color:"#fff", border:"none", borderRadius:8,
        padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity:saving?0.6:1,
      }}>{saving ? "Salvando..." : "Salvar dados"}</button>
    </div>
  );
}

// ── Cards visuais executivos ───────────────────────────────────
function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 12px" }}>
      <div style={{ width:3, height:16, borderRadius:2, background:C.brand }}/>
      <p style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, margin:0 }}>{label}</p>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label:string; value:number; max:number; color:string }) {
  const pct = Math.min(100, max > 0 ? (value/max)*100 : 0);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:C.textMid }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:600, color:C.text }}>{fmt(value)}</span>
      </div>
      <div style={{ height:4, borderRadius:4, background:C.border }}>
        <div style={{ height:4, borderRadius:4, background:color, width:`${pct}%`, transition:"width .5s" }}/>
      </div>
    </div>
  );
}

function MetricPill({ label, value, color }: { label:string; value:string; color:string }) {
  return (
    <div style={{ background:color+"12", border:`1px solid ${color}30`, borderRadius:8,
      padding:"10px 14px", display:"flex", flexDirection:"column", gap:3 }}>
      <span style={{ fontSize:10, color:C.textDim, fontWeight:600, textTransform:"uppercase", letterSpacing:.6 }}>{label}</span>
      <span style={{ fontSize:16, fontWeight:700, color }}>{value}</span>
    </div>
  );
}

// ── Export principal ───────────────────────────────────────────
export default function DashboardClient({ financial, history, decisions }: any) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(!financial);

  const cash     = financial?.cash_balance    ?? 68.20;
  const revenue  = financial?.monthly_revenue ?? 0;
  const costs    = financial?.monthly_costs   ?? 225;
  const reserve  = financial?.operational_reserve ?? 0;
  const profit   = revenue - costs;
  const runway   = costs > 0 ? cash / costs : 0;

  // Quanto podemos investir com segurança (mantendo 3 meses de runway)
  const safeToInvest = Math.max(0, cash - costs * 3);

  // Decisões por status
  const approved  = decisions.filter((d:any) => d.status === "approved");
  const analyzing = decisions.filter((d:any) => d.status === "analyzing");
  const rejected  = decisions.filter((d:any) => d.status === "rejected");

  // Saúde geral
  const healthScore = (() => {
    let s = 0;
    if (profit >= 0) s += 40;
    if (runway >= 3) s += 30;
    if (reserve > 0) s += 20;
    if (revenue > 0) s += 10;
    return s;
  })();
  const healthColor  = healthScore >= 70 ? C.green : healthScore >= 40 ? C.yellow : C.red;
  const healthLabel  = healthScore >= 70 ? "Saudável" : healthScore >= 40 ? "Atenção" : "Crítico";

  // O que fazer agora
  const actions: { text:string; color:string }[] = [];
  if (revenue === 0) actions.push({ text:"Prioridade #1: gerar receita — empresa sem entrada há pelo menos 1 mês", color:C.red });
  if (runway < 3)    actions.push({ text:`Runway crítico (${runway.toFixed(1)}m) — evitar qualquer novo custo fixo`, color:C.red });
  if (analyzing.length > 0) actions.push({ text:`${analyzing.length} decisão(ões) aguardando análise no Simulador`, color:C.yellow });
  if (approved.length > 0)  actions.push({ text:`${approved.length} decisão(ões) aprovada(s) — acompanhar implementação`, color:C.green });
  if (actions.length === 0) actions.push({ text:"Situação estável — manter monitoramento mensal dos indicadores", color:C.green });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:19, fontWeight:700, color:C.text, margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:12, color:C.textDim, margin:"3px 0 0" }}>
            Iniciativa Consultoria · {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
          </p>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={{
          background:"transparent", border:`1px solid ${C.border}`, borderRadius:8,
          padding:"7px 14px", fontSize:12, color:C.textMid, cursor:"pointer",
        }}>{showForm ? "Fechar" : "Atualizar dados"}</button>
      </div>

      {showForm && <FinancialForm onSave={() => { setShowForm(false); router.refresh(); }}/>}

      {/* ── PERGUNTA 1: Como está a empresa? ── */}
      <div>
        <SectionTitle label="Como está a empresa?" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>

          {/* Score de saúde visual */}
          <div style={{ background:C.card, border:`1px solid ${healthColor}50`, borderRadius:10,
            padding:"16px 18px", gridColumn:"span 1",
            boxShadow:`0 0 20px ${healthColor}12` }}>
            <p style={{ fontSize:10, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 7px" }}>Saúde geral</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <p style={{ fontSize:26, fontWeight:800, color:healthColor, margin:0, letterSpacing:-1 }}>{healthScore}</p>
              <p style={{ fontSize:11, color:C.textDim, margin:0 }}>/100</p>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:healthColor, padding:"2px 8px",
              background:healthColor+"18", borderRadius:20, border:`1px solid ${healthColor}35` }}>
              {healthLabel}
            </span>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.brand}50`, borderRadius:10,
            padding:"16px 18px", boxShadow:`0 0 20px ${C.brand}12` }}>
            <p style={{ fontSize:10, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 7px" }}>Caixa atual</p>
            <p style={{ fontSize:20, fontWeight:700, color:C.accent, margin:"0 0 3px", letterSpacing:-.5 }}>{fmt(cash)}</p>
            <p style={{ fontSize:11, color:C.textDim, margin:0 }}>disponível agora</p>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px" }}>
            <p style={{ fontSize:10, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 7px" }}>
              {profit >= 0 ? "Lucro mensal" : "Déficit mensal"}
            </p>
            <p style={{ fontSize:20, fontWeight:700, color:profit>=0?C.green:C.red, margin:"0 0 3px", letterSpacing:-.5 }}>
              {fmt(Math.abs(profit))}
            </p>
            <p style={{ fontSize:11, color:C.textDim, margin:0 }}>{profit>=0?"margem positiva":"saindo por mês"}</p>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px" }}>
            <p style={{ fontSize:10, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 7px" }}>Runway</p>
            <p style={{ fontSize:20, fontWeight:700, color:runway<3?C.red:runway<6?C.yellow:C.green, margin:"0 0 3px", letterSpacing:-.5 }}>
              {runway > 0 ? `${runway.toFixed(1)}m` : "—"}
            </p>
            <p style={{ fontSize:11, color:C.textDim, margin:0 }}>sem receita nova</p>
          </div>
        </div>

        {/* Barra de distribuição de custos vs receita */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px", marginTop:12 }}>
          <StatBar label="Caixa disponível"    value={cash}    max={Math.max(cash,costs*6)} color={C.accent}/>
          <StatBar label="Custos mensais"      value={costs}   max={Math.max(cash,costs*6)} color={C.red}/>
          <StatBar label="Reserva operacional" value={reserve} max={Math.max(cash,costs*6)} color={C.brand}/>
        </div>
      </div>

      {/* ── PERGUNTA 2: Quanto podemos investir? ── */}
      <div>
        <SectionTitle label="Quanto podemos investir?" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          <MetricPill label="Disponível no caixa"      value={fmt(cash)}             color={C.accent}/>
          <MetricPill label="Seguro para investir"     value={fmt(safeToInvest)}     color={safeToInvest>0?C.green:C.red}/>
          <MetricPill label="Custo fixo mensal"        value={fmt(costs)}            color={C.yellow}/>
        </div>

        {/* Card FAPERJ destacado */}
        <div style={{ background:"#0d1f2d", border:`1px solid ${C.accent}40`,
          borderRadius:10, padding:"14px 18px", marginTop:12,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>🏛️</span>
            <div>
              <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:C.accent }}>
                Verba FAPERJ disponível: {fmt(FAPERJ_BALANCE)}
              </p>
              <p style={{ margin:0, fontSize:11, color:C.textDim }}>
                Uso restrito a tecnologia & inovação · {fmt(FAPERJ_USED)} já utilizado de {fmt(FAPERJ_TOTAL)}
              </p>
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <p style={{ margin:"0 0 2px", fontSize:18, fontWeight:700, color:C.green }}>{fmt(FAPERJ_BALANCE)}</p>
            <p style={{ margin:0, fontSize:10, color:C.textDim }}>saldo livre</p>
          </div>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
          padding:"14px 18px", marginTop:12, display:"flex", alignItems:"flex-start", gap:12 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{safeToInvest > 0 ? "💡" : "🚫"}</span>
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:C.text, margin:"0 0 3px" }}>
              {safeToInvest > 0
                ? `Margem segura de ${fmt(safeToInvest)} para novos investimentos`
                : "Caixa insuficiente para novos investimentos com segurança"}
            </p>
            <p style={{ fontSize:11, color:C.textDim, margin:0 }}>
              Cálculo: caixa atual menos 3 meses de custos fixos como reserva mínima de segurança
            </p>
          </div>
        </div>

        {/* Decisões aprovadas e em análise */}
        {decisions.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginTop:12 }}>
            <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`,
              display:"flex", gap:16 }}>
              <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>✓ {approved.length} aprovada(s)</span>
              <span style={{ fontSize:12, color:C.yellow, fontWeight:600 }}>◎ {analyzing.length} em análise</span>
              <span style={{ fontSize:12, color:C.red, fontWeight:600 }}>✕ {rejected.length} rejeitada(s)</span>
            </div>
            {decisions.slice(0,4).map((d:any) => {
              const score = d.decision_score ?? 0;
              const col   = score>=70?C.green:score>=40?C.yellow:C.red;
              const stMap: Record<string,string> = { approved:"Aprovado", analyzing:"Em análise", rejected:"Rejeitado", draft:"Rascunho" };
              return (
                <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"10px 18px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
                    background:col+"18", border:`2px solid ${col}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:700, color:col }}>{Math.round(score)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:C.text, margin:0 }}>{d.name}</p>
                    <p style={{ fontSize:11, color:C.textDim, margin:0 }}>
                      {fmt(d.recurring_cost)}/mês · retorno {fmt(d.expected_return)}/mês
                    </p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                    background:col+"18", color:col, border:`1px solid ${col}35`, flexShrink:0 }}>
                    {stMap[d.status]||"—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PERGUNTA 3: O que devemos fazer agora? ── */}
      <div>
        <SectionTitle label="O que devemos fazer agora?" />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ background:a.color+"0e", border:`1px solid ${a.color}30`,
              borderRadius:9, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:a.color,
                flexShrink:0, marginTop:5 }}/>
              <p style={{ fontSize:12, color:C.textMid, margin:0, lineHeight:1.6 }}>{a.text}</p>
            </div>
          ))}
        </div>

        {/* Próximos vencimentos anuais (se houver nas notes) */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:9,
          padding:"12px 16px", marginTop:12, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:14, flexShrink:0 }}>📅</span>
          <p style={{ fontSize:11, color:C.textDim, margin:0, lineHeight:1.6 }}>
            Cadastre seus custos anuais em <b style={{color:C.text}}>"Atualizar dados"</b> para receber alertas de vencimento aqui.
          </p>
        </div>
      </div>

    </div>
  );
}
