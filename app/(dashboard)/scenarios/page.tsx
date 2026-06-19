"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { genScenarios } from "@/lib/calculations/score";

const C = {
  brand:"#690a96",accent:"#50d9c9",card:"#141420",border:"#1e1e32",
  surface:"#0f0f18",text:"#f1f0f5",textMid:"#94a3b8",textDim:"#475569",
  green:"#50d9c9",yellow:"#f59e0b",red:"#ef4444",
};
const fmt  = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtK = (v: number) => Math.abs(v)>=1000?`R$${(v/1000).toFixed(1)}k`:fmt(v);

const DEFAULT_FIN = { cashBalance:68.20,monthlyRevenue:0,monthlyCosts:225,operationalReserve:0 };

const TT = ({ active,payload,label }: any) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12 }}>
      <p style={{ color:C.textMid,marginBottom:5,fontWeight:600 }}>{label}</p>
      {payload.map((p: any,i: number)=>(
        <p key={i} style={{ color:p.color,margin:"2px 0" }}>{p.name}: {fmtK(p.value)}</p>
      ))}
    </div>
  );
};

export default function ScenariosPage() {
  const [decisions,setDecs] = useState<any[]>([]);
  const [fin,setFin]        = useState(DEFAULT_FIN);
  const [selId,setSelId]    = useState("");
  const [horizon,setHorizon]= useState(12);

  useEffect(()=>{
    fetch("/api/decisions").then(r=>r.json()).then(d=>{ if(Array.isArray(d)){ setDecs(d); if(d[0]) setSelId(d[0].id); } });
    fetch("/api/financial").then(r=>r.json()).then(d=>{ if(d?.cash_balance!=null) setFin({
      cashBalance:d.cash_balance,monthlyRevenue:d.monthly_revenue,
      monthlyCosts:d.monthly_costs,operationalReserve:d.operational_reserve,
    }); });
  },[]);

  const sel  = decisions.find(d=>d.id===selId);
  const data = sel ? genScenarios(fin,{
    oneTimeCost:sel.one_time_cost??0,recurringCost:sel.recurring_cost??0,
    expectedReturn:sel.expected_return??0,returnStartMonth:sel.return_start_month??1,
  },horizon) : [];

  const sumCard = (label:string, key:"pessimista"|"realista"|"otimista", color:string) => {
    if (!data.length) return null;
    const last  = data[data.length-1][key];
    const delta = last - fin.cashBalance;
    return (
      <div style={{ background:C.card,border:`1px solid ${color}35`,borderRadius:10,padding:"16px 18px" }}>
        <p style={{ margin:"0 0 7px",fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:.6 }}>{label}</p>
        <p style={{ margin:"0 0 2px",fontSize:20,fontWeight:700,color:C.text }}>{fmtK(last)}</p>
        <p style={{ margin:0,fontSize:11,color:delta>=0?C.green:C.red }}>{delta>=0?"+":""}{fmtK(delta)} vs hoje</p>
      </div>
    );
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:22 }}>
      <div>
        <h1 style={{ fontSize:19,fontWeight:700,color:C.text,margin:0 }}>Cenários</h1>
        <p style={{ fontSize:12,color:C.textDim,margin:"3px 0 0" }}>Projeção de caixa em 3 perspectivas</p>
      </div>

      <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
        <div style={{ flex:1,minWidth:180 }}>
          <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:5,fontWeight:600 }}>Decisão</label>
          <select value={selId} onChange={e=>setSelId(e.target.value)}
            style={{ width:"100%",padding:"9px 12px" }}>
            {decisions.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11,color:C.textDim,display:"block",marginBottom:5,fontWeight:600 }}>Horizonte</label>
          <div style={{ display:"flex",gap:6 }}>
            {[3,6,12].map(h=>(
              <button key={h} onClick={()=>setHorizon(h)} style={{
                background:horizon===h?C.brand:C.card,color:horizon===h?"#fff":C.textMid,
                border:`1px solid ${horizon===h?C.brand:C.border}`,borderRadius:8,
                padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer" }}>{h}m</button>
            ))}
          </div>
        </div>
      </div>

      {sel&&data.length>0&&(
        <>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            {sumCard("Pessimista","pessimista",C.red)}
            {sumCard("Realista","realista",C.yellow)}
            {sumCard("Otimista","otimista",C.green)}
          </div>
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 20px 12px" }}>
            <p style={{ fontSize:13,fontWeight:600,color:C.text,margin:"0 0 4px" }}>Projeção de Caixa — {sel.name}</p>
            <p style={{ fontSize:11,color:C.textDim,margin:"0 0 18px" }}>{horizon} meses · valores em R$</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="mes" tick={{ fill:C.textDim,fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>`${(v/1).toFixed(0)}`} tick={{ fill:C.textDim,fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Line type="monotone" dataKey="pessimista" name="Pessimista" stroke={C.red}    strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
                <Line type="monotone" dataKey="realista"   name="Realista"   stroke={C.yellow} strokeWidth={2.5} dot={false}/>
                <Line type="monotone" dataKey="otimista"   name="Otimista"   stroke={C.green}  strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!decisions.length&&(
        <div style={{ textAlign:"center",padding:60,color:C.textDim,fontSize:13 }}>
          Crie decisões no Simulador para gerar cenários
        </div>
      )}
    </div>
  );
}
