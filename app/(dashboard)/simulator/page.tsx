"use client";

import { useState, useEffect } from "react";
import { calcScore, genScenarios } from "@/lib/calculations/score";
import { toast } from "sonner";

const C = {
  brand:"#690a96",accent:"#50d9c9",card:"#141420",border:"#1e1e32",
  surface:"#0f0f18",text:"#f1f0f5",textMid:"#94a3b8",textDim:"#475569",
  green:"#50d9c9",yellow:"#f59e0b",red:"#ef4444",
};

const fmt  = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

// Dados financeiros reais da Iniciativa (fallback enquanto não há no banco)
const DEFAULT_FIN = { cashBalance:68.20, monthlyRevenue:0, monthlyCosts:225, operationalReserve:0 };

function ScoreRing({ score, size=90 }: { score:number; size?:number }) {
  const col = score>=70?C.green:score>=40?C.yellow:C.red;
  const r=size*.38, circ=2*Math.PI*r, dash=circ*(score/100);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={size*.09}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col}
          strokeWidth={size*.09} strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 5px ${col}80)`, transition:"stroke-dasharray .6s" }}/>
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill={C.text} fontSize={size*.19} fontWeight="700"
          style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px` }}>
          {Math.round(score)}
        </text>
      </svg>
      <span style={{ fontSize:10, fontWeight:700, color:col, padding:"2px 9px",
        background:col+"18", borderRadius:20, border:`1px solid ${col}35` }}>
        {score>=70?"Recomendado":score>=40?"Atenção":"Não Recomendado"}
      </span>
    </div>
  );
}

function Badge({ status }: { status:string }) {
  const m: Record<string,{l:string;c:string}> = {
    approved:{l:"Aprovado",c:C.green}, analyzing:{l:"Em análise",c:C.yellow},
    rejected:{l:"Rejeitado",c:C.red}, draft:{l:"Rascunho",c:C.brand},
  };
  const s = m[status]||m.draft;
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
    background:s.c+"18", color:s.c, border:`1px solid ${s.c}35` }}>{s.l}</span>;
}

export default function SimulatorPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [fin, setFin]             = useState(DEFAULT_FIN);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    name:"", category:"marketing", one_time_cost:"", recurring_cost:"",
    expected_return:"", return_start_month:"1", observations:"",
  });
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    fetch("/api/decisions").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setDecisions(d); });
    fetch("/api/financial").then(r=>r.json()).then(d=>{ if(d?.cash_balance!=null) setFin({
      cashBalance:d.cash_balance, monthlyRevenue:d.monthly_revenue,
      monthlyCosts:d.monthly_costs, operationalReserve:d.operational_reserve,
    }); });
  }, []);

  const upd = (k:string,v:string) => {
    const next = {...form,[k]:v};
    setForm(next);
    const oc=+next.one_time_cost||0, rc=+next.recurring_cost||0, er=+next.expected_return||0;
    if (rc||er) setPreview(calcScore(fin,{oneTimeCost:oc,recurringCost:rc,expectedReturn:er,returnStartMonth:+next.return_start_month}));
    else setPreview(null);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome da decisão"); return; }
    setSaving(true);
    const res = await fetch("/api/decisions",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        name:form.name, category:form.category,
        one_time_cost:+form.one_time_cost||0, recurring_cost:+form.recurring_cost||0,
        expected_return:+form.expected_return||0, return_start_month:+form.return_start_month||1,
        observations:form.observations,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error("Erro: "+data.error); return; }
    setDecisions(p=>[data,...p]);
    setForm({name:"",category:"marketing",one_time_cost:"",recurring_cost:"",expected_return:"",return_start_month:"1",observations:""});
    setPreview(null); setShowForm(false);
    toast.success("Decisão registrada!");
  };

  const updateStatus = async (id:string, status:string) => {
    await fetch(`/api/decisions/${id}`,{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) });
    setDecisions(p=>p.map(d=>d.id===id?{...d,status}:d));
    toast.success(status==="approved"?"Decisão aprovada":"Decisão rejeitada");
  };

  const field = (label:string, k:string, type="number", ph="") => (
    <div>
      <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:4,fontWeight:600,letterSpacing:.4 }}>{label}</label>
      <input type={type} value={(form as any)[k]} placeholder={ph} onChange={e=>upd(k,e.target.value)}
        style={{ width:"100%", padding:"9px 12px" }}/>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:19,fontWeight:700,color:C.text,margin:0 }}>Simulador de Decisões</h1>
          <p style={{ fontSize:12,color:C.textDim,margin:"3px 0 0" }}>
            {decisions.length} decisão(ões) · Decision Score calculado automaticamente com dados reais
          </p>
        </div>
        <button onClick={()=>setShowForm(f=>!f)} style={{
          background:showForm?"transparent":C.brand, color:showForm?C.textMid:"#fff",
          border:`1px solid ${showForm?C.border:C.brand}`, borderRadius:8,
          padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer",
        }}>{showForm?"Cancelar":"+ Nova decisão"}</button>
      </div>

      {showForm && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22 }} className="animate-fadein">
          <p style={{ fontSize:13,fontWeight:700,color:C.text,margin:"0 0 16px" }}>Nova Decisão</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}>{field("Nome da decisão *","name","text","Ex: Campanha Meta Ads")}</div>
            <div>
              <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:4,fontWeight:600 }}>Categoria</label>
              <select value={form.category} onChange={e=>upd("category",e.target.value)} style={{ width:"100%",padding:"9px 12px" }}>
                {["marketing","software","tool","service","event","project","hiring","other"].map(c=>
                  <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            {field("Retorno esperado/mês (R$)","expected_return","number","0")}
            {field("Custo único (R$)","one_time_cost","number","0")}
            {field("Custo recorrente/mês (R$)","recurring_cost","number","0")}
            {field("Retorno começa no mês","return_start_month","number","1")}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:4,fontWeight:600 }}>Observações</label>
              <textarea value={form.observations} onChange={e=>upd("observations",e.target.value)} rows={2}
                style={{ width:"100%",padding:"9px 12px",resize:"vertical" }}/>
            </div>
          </div>

          {preview && (
            <div style={{ marginTop:16, display:"flex", gap:18, alignItems:"center",
              background:preview.color+"0e", border:`1px solid ${preview.color}35`,
              borderRadius:10, padding:"14px 18px" }} className="animate-fadein">
              <ScoreRing score={preview.total} size={85}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12,fontWeight:700,color:C.text,margin:"0 0 10px" }}>Decision Score · preview</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["Saúde fin.",preview.fh,25],["Reserva",preview.res,20],["Risco",preview.rk,20],
                    ["Impacto",preview.im,15],["ROI",preview.ro,15],["Break-even",preview.bv,5]].map(([l,v,mx])=>(
                    <div key={String(l)}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                        <span style={{ fontSize:10,color:C.textDim }}>{l}</span>
                        <span style={{ fontSize:10,color:C.text }}>{v}/{mx}</span>
                      </div>
                      <div style={{ height:3,borderRadius:3,background:C.border }}>
                        <div style={{ height:3,borderRadius:3,background:preview.color,width:`${(Number(v)/Number(mx))*100}%`,transition:"width .4s" }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10,display:"flex",gap:16 }}>
                  <span style={{ fontSize:12,color:C.textMid }}>ROI anual: <b style={{color:C.text}}>{preview.roi.toFixed(0)}%</b></span>
                  {preview.breakevenMonths&&<span style={{ fontSize:12,color:C.textMid }}>Break-even: <b style={{color:C.text}}>{preview.breakevenMonths}m</b></span>}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop:14,display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={()=>setShowForm(false)} style={{
              background:"transparent",color:C.textMid,border:`1px solid ${C.border}`,
              borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer" }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{
              background:C.brand,color:"#fff",border:"none",borderRadius:8,
              padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer",opacity:saving?.6:1 }}>
              {saving?"Salvando...":"Registrar decisão"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {decisions.map(d=>{
          const score = d.decision_score ?? 0;
          const col   = score>=70?C.green:score>=40?C.yellow:C.red;
          return (
            <div key={d.id} style={{ background:C.card,border:`1px solid ${C.border}`,
              borderRadius:12,padding:"16px 20px",display:"flex",gap:16,alignItems:"center" }}
              className="animate-fadein">
              <ScoreRing score={score} size={76}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                  <p style={{ margin:0,fontSize:13,fontWeight:700,color:C.text }}>{d.name}</p>
                  <Badge status={d.status}/>
                </div>
                {d.observations&&<p style={{ margin:"0 0 8px",fontSize:11,color:C.textDim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{d.observations}</p>}
                <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
                  {[
                    ["Custo único",fmt(d.one_time_cost??0)],
                    ["Custo/mês",fmt(d.recurring_cost??0)],
                    ["Retorno/mês",fmt(d.expected_return??0)],
                    d.roi_percent!=null?["ROI anual",`${Number(d.roi_percent).toFixed(0)}%`]:null,
                    d.breakeven_months?["Break-even",`${d.breakeven_months}m`]:null,
                  ].filter(Boolean).map(([l,v])=>(
                    <div key={String(l)}>
                      <p style={{ margin:0,fontSize:10,color:C.textDim }}>{l}</p>
                      <p style={{ margin:0,fontSize:13,fontWeight:600,color:C.text }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              {!["approved","rejected"].includes(d.status) && (
                <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                  <button onClick={()=>updateStatus(d.id,"approved")} style={{
                    background:C.green+"15",color:C.green,border:`1px solid ${C.green}35`,
                    borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer" }}>Aprovar</button>
                  <button onClick={()=>updateStatus(d.id,"rejected")} style={{
                    background:C.red+"15",color:C.red,border:`1px solid ${C.red}35`,
                    borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer" }}>Rejeitar</button>
                </div>
              )}
            </div>
          );
        })}
        {decisions.length===0&&(
          <div style={{ textAlign:"center",padding:48,color:C.textDim,fontSize:13 }}>
            Nenhuma decisão ainda — crie a primeira acima
          </div>
        )}
      </div>
    </div>
  );
}
