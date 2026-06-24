export interface FinancialContext {
  cashBalance: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  operationalReserve: number;
}
 
export interface DecisionInput {
  oneTimeCost: number;
  recurringCost: number;
  expectedReturn: number;
  returnStartMonth: number;
  returnType?: "financial" | "indirect" | "infrastructure"; // #9
}
 
export interface ScoreResult {
  total: number;
  fh: number; res: number; rk: number; im: number; ro: number; bv: number;
  roi: number;
  breakevenMonths: number | null;
  label: "Recomendado" | "Atenção" | "Não Recomendado";
  color: string;
}
 
export function calcScore(fin: FinancialContext, dec: DecisionInput): ScoreResult {
  const mp  = fin.monthlyRevenue - fin.monthlyCosts;
  const pc  = fin.monthlyCosts + dec.recurringCost;
  const pp  = (fin.monthlyRevenue + dec.expectedReturn) - pc;
  const ty  = dec.oneTimeCost + dec.recurringCost * 12;
 
  // #9 — Se retorno é indireto/infra, não penaliza ROI/impacto por ter retorno 0
  const isIndirect = dec.returnType === "indirect" || dec.returnType === "infrastructure";
 
  const roi = dec.oneTimeCost > 0
    ? ((dec.expectedReturn * 12 - dec.recurringCost * 12 - dec.oneTimeCost) / dec.oneTimeCost) * 100
    : dec.expectedReturn > dec.recurringCost ? 100 : 0;
 
  const rr  = fin.cashBalance > 0 ? ty / fin.cashBalance : 1;
  const bev = dec.expectedReturn > dec.recurringCost
    ? dec.oneTimeCost / (dec.expectedReturn - dec.recurringCost) : Infinity;
 
  // Saúde financeira (0-25)
  let fh = 0;
  const r = mp / (dec.recurringCost || 1);
  if (r >= 3) fh=25; else if (r >= 2) fh=20; else if (r >= 1) fh=15; else if (r >= .5) fh=8; else fh=3;
 
  // Reserva (0-20) — usa caixa como proxy já que não há reserva separada
  const cashCoverage = fin.cashBalance / (pc || 1);
  let rs = 0;
  if (cashCoverage >= 6) rs=20; else if (cashCoverage >= 4) rs=15;
  else if (cashCoverage >= 3) rs=10; else if (cashCoverage >= 2) rs=5; else if (cashCoverage >= 1) rs=2;
 
  // Risco (0-20)
  let rk = 0;
  if (rr <= .1) rk=20; else if (rr <= .2) rk=16; else if (rr <= .35) rk=12;
  else if (rr <= .5) rk=7; else if (rr <= .75) rk=3;
 
  // Impacto (0-15)
  let im = 0;
  if (isIndirect) {
    // Retorno indireto/infra: pontua pela sustentabilidade do custo, não pelo retorno
    const affordability = mp / (dec.recurringCost || 1);
    if (affordability >= 2) im=12; else if (affordability >= 1) im=8;
    else if (affordability >= 0) im=5; else im=2;
  } else {
    if (pp > mp) {
      const d=((pp-mp)/Math.abs(mp||1))*100;
      if(d>=30)im=15; else if(d>=15)im=12; else if(d>=5)im=8; else im=4;
    }
  }
 
  // ROI (0-15)
  let ro = 0;
  if (isIndirect) {
    // Indireto: pontua pela necessidade estratégica (custo baixo = melhor)
    const monthlyCostRatio = dec.recurringCost / (fin.monthlyRevenue || fin.monthlyCosts || 1);
    if (monthlyCostRatio <= 0.05) ro=15; else if (monthlyCostRatio <= 0.1) ro=12;
    else if (monthlyCostRatio <= 0.2) ro=9; else if (monthlyCostRatio <= 0.35) ro=6; else ro=3;
  } else {
    if (roi>=200) ro=15; else if(roi>=100) ro=12; else if(roi>=50) ro=9;
    else if(roi>=20) ro=6; else if(roi>=0) ro=3;
  }
 
  // Break-even (0-5)
  let bv = 0;
  if (isIndirect) {
    bv = 4; // Indireto não tem break-even mensurável, mas é válido
  } else if (dec.oneTimeCost===0 && dec.expectedReturn>dec.recurringCost) {
    bv=5;
  } else if(bev<=3) bv=5; else if(bev<=6) bv=4; else if(bev<=12) bv=3; else if(bev<=24) bv=1;
 
  const total = Math.min(100, fh+rs+rk+im+ro+bv);
 
  return {
    total, fh, res: rs, rk, im, ro, bv,
    roi: Math.round(roi * 10) / 10,
    breakevenMonths: isFinite(bev) && !isIndirect ? Math.ceil(bev) : null,
    label: total>=70 ? "Recomendado" : total>=40 ? "Atenção" : "Não Recomendado",
    color: total>=70 ? "#50d9c9" : total>=40 ? "#f59e0b" : "#ef4444",
  };
}
 
export function genScenarios(fin: FinancialContext, dec: DecisionInput, months=12) {
  const m = { p:{r:.5,c:1.2,v:.9}, r:{r:1,c:1,v:1}, o:{r:1.4,c:.85,v:1.1} } as const;
  const proj = (k: "p"|"r"|"o") => {
    let cash = fin.cashBalance - dec.oneTimeCost;
    return Array.from({length:months},(_,i)=>{
      const n=i+1;
      const rev = fin.monthlyRevenue*m[k].v + (n>=dec.returnStartMonth ? dec.expectedReturn*m[k].r : 0);
      const cost = fin.monthlyCosts*m[k].c + dec.recurringCost*m[k].c;
      cash += rev-cost;
      return { mes:`M${n}`, caixa: Math.round(cash) };
    });
  };
  const pp=proj('p'), rr=proj('r'), oo=proj('o');
  return rr.map((_,i)=>({ mes:`M${i+1}`, pessimista:pp[i].caixa, realista:rr[i].caixa, otimista:oo[i].caixa }));
}
