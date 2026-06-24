"use client";

import { useState, useEffect } from "react";
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
const fmtK = (v: number) => Math.abs(v) >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : fmt(v);

const FAPERJ_TOTAL = 58600;
const FAPERJ_USED  = 2557.32;

const INITIAL_FAPERJ_ITEMS = [
  { id:1,  cat:"Prospecção",   name:"Google Ads",                 value:2000,   recurrent:true,  active:true },
  { id:2,  cat:"Prospecção",   name:"LinkedIn Ads",               value:1000,   recurrent:true,  active:true },
  { id:3,  cat:"Prospecção",   name:"Meta Ads",                   value:500,    recurrent:true,  active:true },
  { id:4,  cat:"Site",         name:"Reformulação do site",       value:7200,   recurrent:false, active:true },
  { id:5,  cat:"Ferramentas",  name:"Canva Pro",                  value:300,    recurrent:false, active:true },
  { id:6,  cat:"Ferramentas",  name:"Lightroom",                  value:1140,   recurrent:false, active:true },
  { id:7,  cat:"Ferramentas",  name:"CapCut Pro",                 value:234.90, recurrent:false, active:true },
  { id:8,  cat:"Ferramentas",  name:"RD Station Marketing",       value:300,    recurrent:true,  active:true },
  { id:9,  cat:"Equipamentos", name:"Computador",                 value:7000,   recurrent:false, active:true },
  { id:10, cat:"Equipamentos", name:"Celular",                    value:5000,   recurrent:false, active:true },
  { id:11, cat:"Equipamentos", name:"Câmera profissional",        value:5000,   recurrent:false, active:true },
  { id:12, cat:"Equipamentos", name:"Tripé",                      value:100,    recurrent:false, active:true },
  { id:13, cat:"Equipamentos", name:"Lente",                      value:50,     recurrent:false, active:true },
  { id:14, cat:"Equipamentos", name:"Stand",                      value:4000,   recurrent:false, active:true },
  { id:15, cat:"Cursos FGV",   name:"Adm. Estratégica de Vendas", value:997.60, recurrent:false, active:true },
  { id:16, cat:"Cursos FGV",   name:"Análise de Viabilidade",     value:997.60, recurrent:false, active:true },
  { id:17, cat:"Cursos FGV",   name:"Excelência em Vendas B2B",   value:997.60, recurrent:false, active:true },
  { id:18, cat:"Cursos FGV",   name:"Experiência do Cliente",     value:997.60, recurrent:false, active:true },
  { id:19, cat:"Cursos FGV",   name:"Gestão de Projetos",         value:997.60, recurrent:false, active:true },
  { id:20, cat:"Cursos FGV",   name:"Gestão de Vendas",           value:997.60, recurrent:false, active:true },
];

interface AnnualCost { id:number; name:string; amount:string; due_date:string; }

function AnnualCostsSection({ costs, setCosts }: { costs:AnnualCost[]; setCosts:any }) {
  const add = () => setCosts((p:any) => [...p, { id:Date.now(), name:"", amount:"", due_date:"" }]);
  const upd = (id:number, k:keyof AnnualCost, v:string) =>
    setCosts((p:any) => p.map((c:any) => c.id===id ? {...c,[k]:v} : c));
  const del = (id:number) => setCosts((p:any) => p.filter((c:any) => c.id!==id));
  return (
    <div style={{ gridColumn:"1/-1" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <label style={{ fontSize:11,color:C.textDim,fontWeight:600,letterSpacing:.4 }}>CUSTOS ANUAIS</label>
        <button onClick={add} style={{ background:C.brand+"20",color:C.accent,border:`1px solid ${C.brand}40`,
          borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer" }}>+ Adicionar</button>
      </div>
      {costs.length===0 && <p style={{ fontSize:11,color:C.textDim,fontStyle:"italic" }}>Nenhum custo anual cadastrado.</p>}
      <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
        {costs.map(c=>(
          <div key={c.id} style={{ display:"grid",gridTemplateColumns:"1fr 120px 140px 28px",gap:7,alignItems:"center" }}>
            <input placeholder="Nome (ex: Google Workspace)" value={c.name}
              onChange={e=>upd(c.id,"name",e.target.value)} style={{ padding:"7px 10px",fontSize:12 }}/>
            <input type="number" placeholder="Valor R$" value={c.amount}
              onChange={e=>upd(c.id,"amount",e.target.value)} style={{ padding:"7px 10px",fontSize:12 }}/>
            <input type="date" value={c.due_date}
              onChange={e=>upd(c.id,"due_date",e.target.value)} style={{ padding:"7px 10px",fontSize:12 }}/>
            <button onClick={()=>del(c.id)} style={{ background:C.red+"15",color:C.red,
              border:`1px solid ${C.red}30`,borderRadius:6,padding:"5px",fontSize:13,cursor:"pointer" }}>×</button>
          </div>
        ))}
      </div>
      {costs.length>0 && (
        <p style={{ fontSize:11,color:C.textDim,marginTop:7 }}>
          Total anual: <b style={{color:C.text}}>{fmt(costs.reduce((a,c)=>a+(+c.amount||0),0))}</b>
          {" "}· <b style={{color:C.text}}>{fmt(costs.reduce((a,c)=>a+(+c.amount||0),0)/12)}/mês</b>
        </p>
      )}
    </div>
  );
}

function FaperjSection({ items, setItems }: { items:any[]; setItems:any }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const activeItems = items.filter((i:any)=>i.active);
  const removedValue = items.filter((i:any)=>!i.active).reduce((a:number,i:any)=>a+i.value,0);
  const used = FAPERJ_USED + removedValue;
  const balance = FAPERJ_TOTAL - used;
  const pct = Math.round((used/FAPERJ_TOTAL)*100);
  const cats = ["Todos",...Array.from(new Set(activeItems.map((i:any)=>i.cat)))];
  const filtered = filter==="Todos" ? activeItems : activeItems.filter((i:any)=>i.cat===filter);

  const removeItem = (id:number) => {
    setItems((p:any) => p.map((i:any) => i.id===id ? {...i,active:false} : i));
    toast.success("Item removido do edital");
  };

  return (
    <div style={{ gridColumn:"1/-1", marginTop:8 }}>
      <div style={{ background:"#0d1f2d",border:"1px solid #50d9c940",borderRadius:10,padding:"14px 18px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
              <span>🏛️</span>
              <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.accent }}>Verba FAPERJ</p>
              <span style={{ fontSize:10,color:C.textDim,padding:"1px 7px",
                background:"#50d9c910",border:"1px solid #50d9c925",borderRadius:20 }}>
                Tecnologia & Inovação
              </span>
            </div>
            <div style={{ display:"flex",gap:20,flexWrap:"wrap" }}>
              {[["Total aprovado",fmt(FAPERJ_TOTAL),C.textMid],["Utilizado",fmt(used),C.yellow],["Saldo",fmt(balance),C.green]].map(([l,v,c])=>(
                <div key={String(l)}>
                  <p style={{ margin:0,fontSize:10,color:C.textDim }}>{l}</p>
                  <p style={{ margin:0,fontSize:15,fontWeight:700,color:String(c) }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10 }}>
              <div style={{ height:4,borderRadius:4,background:C.border,width:260 }}>
                <div style={{ height:4,borderRadius:4,background:C.accent,width:`${pct}%` }}/>
              </div>
              <p style={{ margin:"3px 0 0",fontSize:10,color:C.textDim }}>{pct}% utilizado</p>
            </div>
          </div>
          <button onClick={()=>setOpen(o=>!o)} style={{ background:"transparent",
            border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,color:C.textMid,cursor:"pointer" }}>
            {open?"Fechar":"Ver itens"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginTop:10 }}>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setFilter(c)} style={{
                background:filter===c?C.accent+"22":"transparent",color:filter===c?C.accent:C.textDim,
                border:`1px solid ${filter===c?C.accent+"50":C.border}`,
                borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer" }}>{c}</button>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {filtered.map((item:any)=>(
              <div key={item.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"8px 12px",background:C.surface,borderRadius:8,border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
                  <span style={{ fontSize:10,color:C.textDim,padding:"2px 7px",background:C.border,borderRadius:20,flexShrink:0 }}>{item.cat}</span>
                  <span style={{ fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</span>
                  {item.recurrent && <span style={{ fontSize:9,color:C.yellow,padding:"1px 6px",background:C.yellow+"15",border:`1px solid ${C.yellow}30`,borderRadius:20,flexShrink:0 }}>/mês</span>}
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:C.accent }}>{fmt(item.value)}</span>
                  <button onClick={()=>removeItem(item.id)} style={{
                    background:C.red+"15",color:C.red,border:`1px solid ${C.red}30`,
                    borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer" }}>Remover</button>
                </div>
              </div>
            ))}
          </div>
          {activeItems.length===0 && <p style={{ textAlign:"center",padding:20,fontSize:12,color:C.textDim }}>Todos os itens foram removidos.</p>}
          <p style={{ margin:"12px 0 0",fontSize:11,color:C.textDim }}>⚠️ Confirme com a FAPERJ quais itens foram aprovados antes de remover.</p>
        </div>
      )}
    </div>
  );
}

function FinancialForm({ onSave, faperjItems, setFaperjItems }: any) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [annualCosts, setAnnualCosts] = useState<AnnualCost[]>([]);
  const thisMonth = new Date().toISOString().slice(0,7);
  const [form, setForm] = useState({ cash_balance:"", monthly_revenue:"", monthly_costs:"", reference_month:thisMonth, notes:"" });
  const [loaded, setLoaded] = useState(false);

  useEffect(()=>{
    const sb = createClient();
    sb.auth.getUser().then(async ({data:{user}})=>{
      if (!user) { setLoaded(true); return; }
      const {data} = await sb.from("financial_data").select("*")
        .eq("user_id",user.id).eq("reference_month",thisMonth+"-01").maybeSingle();
      if (data) setForm({
        cash_balance: String(data.cash_balance),
        monthly_revenue: String(data.monthly_revenue),
        monthly_costs: String(data.monthly_costs),
        reference_month: thisMonth, notes: data.notes||"",
      });
      setLoaded(true);
    });
  },[]);

  const save = async () => {
    setSaving(true);
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) return;
    const annualMonthly = annualCosts.reduce((a,c)=>a+(+c.amount||0),0)/12;
    const annualNotes = annualCosts.length>0
      ? ` | Custos anuais: ${annualCosts.map(c=>`${c.name} R$${c.amount} venc.${c.due_date}`).join(", ")}` : "";
    const {error} = await supabase.from("financial_data").upsert([{
      user_id:user.id, reference_month:form.reference_month+"-01",
      cash_balance:+form.cash_balance||0, monthly_revenue:+form.monthly_revenue||0,
      monthly_costs:(+form.monthly_costs||0)+annualMonthly,
      operational_reserve:0, notes:(form.notes||"")+annualNotes,
    }],{onConflict:"user_id,reference_month"});
    setSaving(false);
    if (error) { toast.error("Erro: "+error.message); return; }
    toast.success("Dados salvos!"); onSave();
  };

  const inp = (label:string, key:string, type="number") => (
    <div>
      <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:4,fontWeight:600,letterSpacing:.4 }}>{label}</label>
      <input type={type} value={(form as any)[key]} placeholder="0"
        onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ width:"100%",padding:"9px 12px" }}/>
    </div>
  );

  if (!loaded) return <div style={{ padding:16,color:C.textDim,fontSize:12 }}>Carregando dados do mês...</div>;

  return (
    <div style={{ background:C.card,border:`1px solid ${C.brand}40`,borderRadius:12,padding:22,marginBottom:24 }}>
      <p style={{ fontSize:13,fontWeight:700,color:C.text,margin:"0 0 4px" }}>Atualizar Dados Financeiros</p>
      <p style={{ fontSize:11,color:C.textDim,margin:"0 0 16px" }}>Mês atual pré-carregado. Campos em branco = zero.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12 }}>
        <div>
          <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:4,fontWeight:600 }}>Mês de referência</label>
          <input type="month" value={form.reference_month}
            onChange={e=>setForm(f=>({...f,reference_month:e.target.value}))} style={{ width:"100%",padding:"9px 12px" }}/>
        </div>
        {inp("Caixa atual (R$)","cash_balance")}
        {inp("Receita mensal (R$)","monthly_revenue")}
        {inp("Custos mensais (R$)","monthly_costs")}
        <div>
          <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:4,fontWeight:600 }}>Observações</label>
          <input type="text" value={form.notes} placeholder="Ex: mês de retomada"
            onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ width:"100%",padding:"9px 12px" }}/>
        </div>
        <AnnualCostsSection costs={annualCosts} setCosts={setAnnualCosts}/>
        <FaperjSection items={faperjItems} setItems={setFaperjItems}/>
      </div>
      <button onClick={save} disabled={saving} style={{ marginTop:16,background:C.brand,color:"#fff",
        border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",opacity:saving?0.6:1 }}>
        {saving?"Salvando...":"Salvar dados"}
      </button>
    </div>
  );
}

function SectionTitle({ label }: { label:string }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,margin:"4px 0 12px" }}>
      <div style={{ width:3,height:16,borderRadius:2,background:C.brand }}/>
      <p style={{ fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1,margin:0 }}>{label}</p>
    </div>
  );
}

function MetricPill({ label,value,color }: { label:string;value:string;color:string }) {
  return (
    <div style={{ background:color+"12",border:`1px solid ${color}30`,borderRadius:8,padding:"10px 14px" }}>
      <span style={{ fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:.6,display:"block",marginBottom:3 }}>{label}</span>
      <span style={{ fontSize:16,fontWeight:700,color }}>{value}</span>
    </div>
  );
}

function StatBar({ label,value,max,color }: { label:string;value:number;max:number;color:string }) {
  const pct = Math.min(100,max>0?(value/max)*100:0);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
        <span style={{ fontSize:11,color:C.textMid }}>{label}</span>
        <span style={{ fontSize:11,fontWeight:600,color:C.text }}>{fmt(value)}</span>
      </div>
      <div style={{ height:4,borderRadius:4,background:C.border }}>
        <div style={{ height:4,borderRadius:4,background:color,width:`${pct}%`,transition:"width .5s" }}/>
      </div>
    </div>
  );
}

const TT = ({ active,payload,label }: any) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12 }}>
      <p style={{ color:C.textMid,marginBottom:5,fontWeight:600 }}>{label}</p>
      {payload.map((p:any,i:number)=>(
        <p key={i} style={{ color:p.color,margin:"2px 0" }}>{p.name}: {fmtK(p.value)}</p>
      ))}
    </div>
  );
};

export default function DashboardClient({ financial, history, decisions }: any) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(!financial);
  const [faperjItems, setFaperjItems] = useState(INITIAL_FAPERJ_ITEMS);
  const [allHistory, setAllHistory] = useState<any[]>(history||[]);

  useEffect(()=>{
    const sb = createClient();
    sb.auth.getUser().then(async ({data:{user}})=>{
      if (!user) return;
      const {data} = await sb.from("financial_data")
        .select("reference_month,monthly_revenue,monthly_costs,cash_balance,notes")
        .eq("user_id",user.id).order("reference_month",{ascending:true}).limit(12);
      if (data) setAllHistory(data);
    });
  },[]);

  const cash    = financial?.cash_balance    ?? 0;
  const revenue = financial?.monthly_revenue ?? 0;
  const costs   = financial?.monthly_costs   ?? 225;
  const profit  = revenue - costs;
  const runway  = costs>0 ? cash/costs : 0;
  const [faperjBalance, setFaperjBalance] = useState(FAPERJ_TOTAL - FAPERJ_USED);

useEffect(() => {
  const sb = createClient();
  sb.auth.getUser().then(async ({ data: { user } }) => {
    if (!user) return;
    const { data } = await sb.from("faperj_transactions").select("amount, type");
    if (data) {
      const total = data.reduce((acc: number, t: any) =>
        t.type === "debit" ? acc - t.amount : acc + t.amount, FAPERJ_TOTAL);
      setFaperjBalance(Math.max(0, total));
    }
  });
}, []);
  const safeToInvest  = Math.max(0, cash - costs*3);

  const approved  = decisions.filter((d:any)=>d.status==="approved");
  const analyzing = decisions.filter((d:any)=>d.status==="analyzing");
  const rejected  = decisions.filter((d:any)=>d.status==="rejected");

  // #5 — Score com explicação de cada dimensão
  const healthItems = [
    { label:"Resultado mensal", pts:profit>=0?40:0, max:40, ok:profit>=0,
      reason:profit>=0?`Superávit de ${fmt(profit)}/mês`:`Déficit de ${fmt(Math.abs(profit))}/mês` },
    { label:"Runway", pts:runway>=3?30:runway>=1?15:0, max:30, ok:runway>=3,
      reason:`${runway.toFixed(1)} meses de autonomia${runway<3?" — abaixo do mínimo de 3":""}` },
    { label:"Receita ativa", pts:revenue>0?10:0, max:10, ok:revenue>0,
      reason:revenue>0?`${fmt(revenue)}/mês`:"Receita zero" },
    { label:"Verba FAPERJ", pts:faperjBalance>0?20:0, max:20, ok:faperjBalance>0,
      reason:faperjBalance>0?`${fmt(faperjBalance)} disponível`:"Sem saldo FAPERJ" },
  ];
  const healthScore = healthItems.reduce((a,i)=>a+i.pts,0);
  const healthColor = healthScore>=70?C.green:healthScore>=40?C.yellow:C.red;

  // #4 — Gráfico
  const chartData = allHistory.length>0
    ? allHistory.map((h:any)=>({
        mes: new Date(h.reference_month+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),
        lucro: h.monthly_revenue - h.monthly_costs,
        caixa: h.cash_balance,
      }))
    : [];

  const actions: {text:string;color:string}[] = [];
  if (revenue===0)         actions.push({text:"Prioridade #1: gerar receita — empresa sem entrada no período atual",color:C.red});
  if (runway<3&&runway>0)  actions.push({text:`Runway crítico (${runway.toFixed(1)}m) — evitar novos custos fixos`,color:C.red});
  if (analyzing.length>0)  actions.push({text:`${analyzing.length} decisão(ões) aguardando análise no Simulador`,color:C.yellow});
  if (approved.length>0)   actions.push({text:`${approved.length} decisão(ões) aprovada(s) — acompanhar implementação`,color:C.green});
  if (faperjBalance>0)     actions.push({text:`${fmt(faperjBalance)} da verba FAPERJ disponível para itens do edital`,color:C.accent});
  if (actions.length===0)  actions.push({text:"Situação estável — manter monitoramento mensal",color:C.green});

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:19,fontWeight:700,color:C.text,margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:12,color:C.textDim,margin:"3px 0 0" }}>
            Iniciativa Consultoria · {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
          </p>
        </div>
        <button onClick={()=>setShowForm(f=>!f)} style={{ background:"transparent",border:`1px solid ${C.border}`,
          borderRadius:8,padding:"7px 14px",fontSize:12,color:C.textMid,cursor:"pointer" }}>
          {showForm?"Fechar":"Atualizar dados"}
        </button>
      </div>

      {showForm && <FinancialForm faperjItems={faperjItems} setFaperjItems={setFaperjItems} onSave={()=>{ setShowForm(false); router.refresh(); }}/>}

      {/* 1 — Como está a empresa? */}
      <div>
        <SectionTitle label="Como está a empresa?"/>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
          {/* Score com breakdown */}
          <div style={{ background:C.card,border:`1px solid ${healthColor}50`,borderRadius:10,
            padding:"16px 18px",boxShadow:`0 0 20px ${healthColor}12` }}>
            <p style={{ fontSize:10,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 6px" }}>Saúde geral</p>
            <div style={{ display:"flex",alignItems:"baseline",gap:6,marginBottom:6 }}>
              <p style={{ fontSize:26,fontWeight:800,color:healthColor,margin:0 }}>{healthScore}</p>
              <p style={{ fontSize:11,color:C.textDim,margin:0 }}>/100</p>
            </div>
            <span style={{ fontSize:10,fontWeight:700,color:healthColor,padding:"2px 8px",
              background:healthColor+"18",borderRadius:20,border:`1px solid ${healthColor}35` }}>
              {healthScore>=70?"Saudável":healthScore>=40?"Atenção":"Crítico"}
            </span>
            <div style={{ marginTop:12,display:"flex",flexDirection:"column",gap:6 }}>
              {healthItems.map(item=>(
                <div key={item.label}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                    <span style={{ fontSize:9,color:item.ok?C.textMid:C.red }} title={item.reason}>{item.ok?"✓":"✗"} {item.label}</span>
                    <span style={{ fontSize:9,color:C.textDim }}>{item.pts}/{item.max}</span>
                  </div>
                  <div style={{ height:2,borderRadius:2,background:C.border }}>
                    <div style={{ height:2,borderRadius:2,background:item.ok?healthColor:C.red,width:`${(item.pts/item.max)*100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:C.card,border:`1px solid ${C.brand}50`,borderRadius:10,padding:"16px 18px",boxShadow:`0 0 20px ${C.brand}12` }}>
            <p style={{ fontSize:10,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 7px" }}>Caixa atual</p>
            <p style={{ fontSize:20,fontWeight:700,color:C.accent,margin:"0 0 3px" }}>{fmt(cash)}</p>
            <p style={{ fontSize:11,color:C.textDim,margin:0 }}>disponível agora</p>
          </div>

          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 18px" }}>
            <p style={{ fontSize:10,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 7px" }}>
              {profit>=0?"Lucro mensal":"Déficit mensal"}
            </p>
            <p style={{ fontSize:20,fontWeight:700,color:profit>=0?C.green:C.red,margin:"0 0 3px" }}>{fmt(Math.abs(profit))}</p>
            <p style={{ fontSize:11,color:C.textDim,margin:0 }}>{profit>=0?"superávit":"saindo/mês"}</p>
          </div>

          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 18px" }}>
            <p style={{ fontSize:10,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 7px" }}>Runway</p>
            <p style={{ fontSize:20,fontWeight:700,color:runway<3?C.red:runway<6?C.yellow:C.green,margin:"0 0 3px" }}>
              {runway>0?`${runway.toFixed(1)}m`:"—"}
            </p>
            <p style={{ fontSize:11,color:C.textDim,margin:0 }}>sem receita nova</p>
          </div>
        </div>

        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 18px",marginTop:12 }}>
          <StatBar label="Caixa disponível" value={cash}  max={Math.max(cash,costs*6,1)} color={C.accent}/>
          <StatBar label="Custos mensais"   value={costs} max={Math.max(cash,costs*6,1)} color={C.red}/>
        </div>

        {/* #4 — Gráfico de linha */}
        {chartData.length>1 && (
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 18px 10px",marginTop:12 }}>
            <p style={{ fontSize:13,fontWeight:600,color:C.text,margin:"0 0 4px" }}>Evolução mensal</p>
            <p style={{ fontSize:11,color:C.textDim,margin:"0 0 14px" }}>Caixa e resultado ao longo dos meses cadastrados</p>
            <ResponsiveContainer width="100%" height={180}>
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
                <XAxis dataKey="mes" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>`${v}`} tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="caixa" name="Caixa" stroke={C.brand} fill="url(#gB)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="lucro" name="Resultado" stroke={C.accent} fill="url(#gA)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2 — Quanto podemos investir? */}
      <div>
        <SectionTitle label="Quanto podemos investir?"/>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
          <MetricPill label="Disponível no caixa"  value={fmt(cash)}         color={C.accent}/>
          <MetricPill label="Seguro para investir" value={fmt(safeToInvest)} color={safeToInvest>0?C.green:C.red}/>
          <MetricPill label="Custo fixo mensal"    value={fmt(costs)}        color={C.yellow}/>
        </div>

        <div style={{ background:"#0d1f2d",border:`1px solid ${C.accent}40`,borderRadius:10,
          padding:"14px 18px",marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <span style={{ fontSize:18,flexShrink:0 }}>🏛️</span>
            <div>
              <p style={{ margin:"0 0 2px",fontSize:12,fontWeight:700,color:C.accent }}>Verba FAPERJ disponível</p>
              <p style={{ margin:0,fontSize:11,color:C.textDim }}>Restrita a tecnologia & inovação · {fmt(FAPERJ_USED)} utilizado de {fmt(FAPERJ_TOTAL)}</p>
            </div>
          </div>
          <div style={{ textAlign:"right",flexShrink:0 }}>
            <p style={{ margin:"0 0 2px",fontSize:18,fontWeight:700,color:C.green }}>{fmt(faperjBalance)}</p>
            <p style={{ margin:0,fontSize:10,color:C.textDim }}>saldo livre</p>
          </div>
        </div>

        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,
          padding:"12px 16px",marginTop:10,display:"flex",gap:10,alignItems:"center" }}>
          <span style={{ fontSize:14,flexShrink:0 }}>{safeToInvest>0?"💡":"🚫"}</span>
          <p style={{ fontSize:11,color:C.textMid,margin:0,lineHeight:1.6 }}>
            {safeToInvest>0
              ?`Margem segura de ${fmt(safeToInvest)} para novos investimentos (caixa menos 3 meses de custos)`
              :"Caixa insuficiente para novos investimentos com segurança — mantenha pelo menos 3 meses de custos reservados"}
          </p>
        </div>

        {decisions.length>0 && (
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",marginTop:12 }}>
            <div style={{ padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:16 }}>
              <span style={{ fontSize:12,color:C.green,fontWeight:600 }}>✓ {approved.length} aprovada(s)</span>
              <span style={{ fontSize:12,color:C.yellow,fontWeight:600 }}>◎ {analyzing.length} em análise</span>
              <span style={{ fontSize:12,color:C.red,fontWeight:600 }}>✕ {rejected.length} rejeitada(s)</span>
            </div>
            {decisions.slice(0,4).map((d:any)=>{
              const score=d.decision_score??0; const col=score>=70?C.green:score>=40?C.yellow:C.red;
              const stMap:Record<string,string>={approved:"Aprovado",analyzing:"Em análise",rejected:"Rejeitado",draft:"Rascunho"};
              return (
                <div key={d.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,background:col+"18",border:`2px solid ${col}`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:col }}>{Math.round(score)}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:12,fontWeight:600,color:C.text,margin:0 }}>{d.name}</p>
                    <p style={{ fontSize:11,color:C.textDim,margin:0 }}>{fmt(d.recurring_cost)}/mês · retorno {fmt(d.expected_return)}/mês</p>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                    background:col+"18",color:col,border:`1px solid ${col}35`,flexShrink:0 }}>{stMap[d.status]||"—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3 — O que devemos fazer agora? */}
      <div>
        <SectionTitle label="O que devemos fazer agora?"/>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {actions.map((a,i)=>(
            <div key={i} style={{ background:a.color+"0e",border:`1px solid ${a.color}30`,
              borderRadius:9,padding:"12px 16px",display:"flex",alignItems:"flex-start",gap:10 }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:a.color,flexShrink:0,marginTop:5 }}/>
              <p style={{ fontSize:12,color:C.textMid,margin:0,lineHeight:1.6 }}>{a.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* #10 — Histórico de meses */}
      {allHistory.length>1 && (
        <div>
          <SectionTitle label="Histórico mensal"/>
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                  {["Mês","Caixa","Receita","Custos","Resultado"].map(h=>(
                    <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:10,
                      fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...allHistory].reverse().map((h:any,i:number)=>{
                  const res=h.monthly_revenue-h.monthly_costs;
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}`,background:i%2===0?"transparent":C.surface+"60" }}>
                      <td style={{ padding:"10px 14px",fontSize:12,color:C.text,fontWeight:600 }}>
                        {new Date(h.reference_month+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"2-digit"})}
                      </td>
                      <td style={{ padding:"10px 14px",fontSize:12,color:C.accent }}>{fmt(h.cash_balance)}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,color:C.textMid }}>{fmt(h.monthly_revenue)}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,color:C.textMid }}>{fmt(h.monthly_costs)}</td>
                      <td style={{ padding:"10px 14px",fontSize:12,fontWeight:600,color:res>=0?C.green:C.red }}>{fmt(res)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
