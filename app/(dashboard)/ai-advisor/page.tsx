"use client";

import { useState, useEffect, useRef } from "react";

const C = {
  brand:"#690a96",accent:"#50d9c9",card:"#141420",border:"#1e1e32",
  surface:"#0f0f18",text:"#f1f0f5",textMid:"#94a3b8",textDim:"#475569",
};

const SUGGESTIONS = [
  "Vale a pena manter o Meta Ads agora?",
  "Como reduzir os custos da Iniciativa?",
  "Quais decisões devemos priorizar?",
  "Como melhorar nosso fluxo de caixa?",
  "Qual o risco de continuar com déficit?",
];

export default function AIAdvisorPage() {
  const [msgs, setMsgs]     = useState<any[]>([]);
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [decisions, setDecs]= useState<any[]>([]);
  const [selId, setSelId]   = useState("");
  const bottom              = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    bottom.current?.scrollIntoView({behavior:"smooth"});
  },[msgs]);

  useEffect(()=>{
    fetch("/api/decisions").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setDecs(d); });
  },[]);

  const send = async (text: string) => {
    if (!text.trim()||loading) return;
    const um = { role:"user", content:text, ts:Date.now() };
    setMsgs(p=>[...p,um]); setInput(""); setLoad(true);

    try {
      const res = await fetch("/api/ai-advisor",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          message:text,
          decisionId:selId||null,
          history:msgs.map(m=>({role:m.role,content:m.content})),
        }),
      });
      const data = await res.json();
      setMsgs(p=>[...p,{ role:"assistant", content:data.reply||data.error, ts:Date.now() }]);
    } catch {
      setMsgs(p=>[...p,{ role:"assistant", content:"Erro de conexão.", ts:Date.now() }]);
    } finally { setLoad(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, height:"calc(100vh - 80px)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:19,fontWeight:700,color:C.text,margin:0 }}>IA Consultora</h1>
          <p style={{ fontSize:12,color:C.textDim,margin:"3px 0 0" }}>Análise estratégica com dados reais da Iniciativa</p>
        </div>
        <select value={selId} onChange={e=>setSelId(e.target.value)}
          style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.textMid }}>
          <option value="">Contexto geral</option>
          {decisions.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {selId && decisions.find(d=>d.id===selId) && (
        <div style={{ flexShrink:0,background:C.brand+"15",border:`1px solid ${C.brand}30`,
          borderRadius:8,padding:"9px 14px",fontSize:12,color:C.accent }}>
          Analisando: <b>{decisions.find(d=>d.id===selId)?.name}</b>
        </div>
      )}

      <div style={{ flex:1,background:C.card,border:`1px solid ${C.border}`,
        borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden" }}>

        <div style={{ flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:14 }}>
          {msgs.length===0 && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",height:"100%",gap:18,textAlign:"center" }}>
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#ai_lg)"/>
                <circle cx="10" cy="22" r="3.5" fill="white" fillOpacity=".95"/>
                <circle cx="22" cy="10" r="3.5" fill="white" fillOpacity=".95"/>
                <line x1="12.5" y1="19.5" x2="19.5" y2="12.5" stroke="white" strokeOpacity=".5" strokeWidth="1.5"/>
                <circle cx="22" cy="10" r="1.5" fill="#50d9c9"/>
                <defs>
                  <linearGradient id="ai_lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#690a96"/><stop offset="1" stopColor="#4a0870"/>
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <p style={{ margin:"0 0 3px",fontSize:14,fontWeight:600,color:C.text }}>IA Consultora da Iniciativa</p>
                <p style={{ margin:0,fontSize:12,color:C.textDim }}>Respostas baseadas nos seus dados financeiros reais</p>
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",maxWidth:420 }}>
                {SUGGESTIONS.map(s=>(
                  <button key={s} onClick={()=>send(s)} style={{
                    background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,
                    padding:"6px 14px",fontSize:12,color:C.textMid,cursor:"pointer" }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m,i)=>(
            <div key={i} style={{ display:"flex",gap:10,flexDirection:m.role==="user"?"row-reverse":"row" }} className="animate-fadein">
              <div style={{ width:26,height:26,borderRadius:"50%",flexShrink:0,
                background:m.role==="assistant"?C.brand+"30":C.border,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:10,fontWeight:700,color:m.role==="assistant"?C.accent:C.textMid }}>
                {m.role==="assistant"?"DL":"U"}
              </div>
              <div style={{ maxWidth:"78%",padding:"11px 14px",borderRadius:10,fontSize:13,
                lineHeight:1.65,color:C.text,whiteSpace:"pre-wrap",
                background:m.role==="assistant"?C.surface:C.brand+"20",
                border:`1px solid ${m.role==="assistant"?C.border:C.brand+"40"}`,
                borderTopLeftRadius:m.role==="assistant"?2:10,
                borderTopRightRadius:m.role==="user"?2:10 }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading&&(
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:C.brand+"30",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.accent }}>DL</div>
              <div style={{ padding:"11px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,borderTopLeftRadius:2 }}>
                <span style={{ color:C.accent,fontSize:16,letterSpacing:4,animation:"pulse 1s infinite" }}>···</span>
              </div>
            </div>
          )}
          <div ref={bottom}/>
        </div>

        <div style={{ borderTop:`1px solid ${C.border}`,padding:14,display:"flex",gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send(input)}
            placeholder="Pergunte sobre as finanças ou decisões da Iniciativa..."
            style={{ flex:1,padding:"10px 13px" }}/>
          <button onClick={()=>send(input)} disabled={!input.trim()||loading} style={{
            background:C.brand,color:"#fff",border:"none",borderRadius:8,
            padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",
            opacity:(!input.trim()||loading)?0.45:1 }}>Enviar</button>
        </div>
      </div>
    </div>
  );
}
