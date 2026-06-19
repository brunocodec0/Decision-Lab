import { createClient } from "@/lib/supabase/server";

const fmt = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const C = { card:"#141420",border:"#1e1e32",text:"#f1f0f5",textMid:"#94a3b8",textDim:"#475569",green:"#50d9c9",yellow:"#f59e0b",red:"#ef4444",surface:"#0f0f18" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: decisions } = await supabase
    .from("v_decisions_calculated")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending:false });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div>
        <h1 style={{ fontSize:19,fontWeight:700,color:C.text,margin:0 }}>Histórico de Decisões</h1>
        <p style={{ fontSize:12,color:C.textDim,margin:"3px 0 0" }}>
          {decisions?.length ?? 0} decisão(ões) registrada(s)
        </p>
      </div>

      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Decisão","Score","Custo anual","ROI","Status","Data"].map(h=>(
                <th key={h} style={{ padding:"11px 16px",textAlign:"left",fontSize:10,
                  fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(decisions||[]).map((d,i)=>{
              const score = d.decision_score ?? 0;
              const col   = score>=70?C.green:score>=40?C.yellow:C.red;
              const statusMap: Record<string,{l:string;c:string}> = {
                approved:{l:"Aprovado",c:C.green},
                analyzing:{l:"Em análise",c:C.yellow},
                rejected:{l:"Rejeitado",c:C.red},
                draft:{l:"Rascunho",c:"#6366f1"},
              };
              const st = statusMap[d.status]||statusMap.draft;
              return (
                <tr key={d.id} style={{ borderBottom:`1px solid ${C.border}`,background:i%2===0?"transparent":C.surface+"60" }}>
                  <td style={{ padding:"11px 16px",fontSize:13,fontWeight:600,color:C.text }}>{d.name}</td>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",
                      width:34,height:34,borderRadius:"50%",background:col+"18",
                      border:`2px solid ${col}`,fontSize:11,fontWeight:700,color:col }}>
                      {Math.round(score)}
                    </div>
                  </td>
                  <td style={{ padding:"11px 16px",fontSize:13,color:C.textMid }}>{fmt((d.one_time_cost||0)+(d.recurring_cost||0)*12)}</td>
                  <td style={{ padding:"11px 16px",fontSize:13,fontWeight:600,color:d.roi_percent>=0?C.green:C.red }}>
                    {d.roi_percent!=null?`${Number(d.roi_percent).toFixed(0)}%`:"—"}
                  </td>
                  <td style={{ padding:"11px 16px" }}>
                    <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                      background:st.c+"18",color:st.c,border:`1px solid ${st.c}35` }}>{st.l}</span>
                  </td>
                  <td style={{ padding:"11px 16px",fontSize:11,color:C.textDim }}>
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!decisions?.length&&(
          <div style={{ textAlign:"center",padding:48,color:C.textDim,fontSize:13 }}>
            Nenhuma decisão registrada ainda
          </div>
        )}
      </div>
    </div>
  );
}
