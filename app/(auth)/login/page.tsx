"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="url(#ll)"/>
      <circle cx="10" cy="22" r="3.5" fill="white" fillOpacity="0.95"/>
      <circle cx="22" cy="10" r="3.5" fill="white" fillOpacity="0.95"/>
      <line x1="12.5" y1="19.5" x2="19.5" y2="12.5" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      <circle cx="22" cy="10" r="1.5" fill="#50d9c9"/>
      <defs>
        <linearGradient id="ll" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#690a96"/>
          <stop offset="1" stopColor="#4a0870"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const router  = useRouter();
  const supabase = createClient();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode]       = useState<"login"|"register">("login");
  const [name, setName]       = useState("");

  const handle = async () => {
    if (!email || !password) return toast.error("Preencha todos os campos");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        if (!name) return toast.error("Informe seu nome");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Conta criada! Faça login para continuar.");
        setMode("login");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: {
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#09090f", padding:20,
    } as React.CSSProperties,
    card: {
      width:"100%", maxWidth:380, background:"#141420",
      border:"1px solid #1e1e32", borderRadius:14, padding:"36px 32px",
    } as React.CSSProperties,
    label: { fontSize:11, color:"#475569", display:"block", marginBottom:6, fontWeight:600, letterSpacing:.5, textTransform:"uppercase" } as React.CSSProperties,
    input: { width:"100%", padding:"10px 13px", marginBottom:14, fontSize:13 } as React.CSSProperties,
    btn: {
      width:"100%", padding:"11px", background:"#690a96", color:"#fff",
      border:"none", borderRadius:9, fontSize:14, fontWeight:700,
      cursor:"pointer", marginTop:4, opacity:loading?0.6:1,
    } as React.CSSProperties,
    link: { background:"none", border:"none", color:"#50d9c9", fontSize:12, cursor:"pointer", textDecoration:"underline" } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="animate-fadein">
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
          <Logo/>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#f1f0f5", lineHeight:1 }}>DecisionLab</p>
            <p style={{ fontSize:9, color:"#690a96", letterSpacing:.8, marginTop:3 }}>INICIATIVA CONSULTORIA</p>
          </div>
        </div>

        <h1 style={{ fontSize:17, fontWeight:700, color:"#f1f0f5", marginBottom:4 }}>
          {mode==="login" ? "Entrar na plataforma" : "Criar conta"}
        </h1>
        <p style={{ fontSize:12, color:"#475569", marginBottom:24 }}>
          {mode==="login" ? "Acesso restrito à equipe J. Financeiro" : "Crie sua conta para acessar o sistema"}
        </p>

        {mode==="register" && (
          <>
            <label style={s.label}>Nome completo</label>
            <input style={s.input} placeholder="Seu nome" value={name} onChange={e=>setName(e.target.value)}/>
          </>
        )}

        <label style={s.label}>E-mail</label>
        <input style={s.input} type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>

        <label style={s.label}>Senha</label>
        <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handle()}/>

        <button style={s.btn} onClick={handle} disabled={loading}>
          {loading ? "Aguarde..." : mode==="login" ? "Entrar" : "Criar conta"}
        </button>

        <p style={{ marginTop:20, textAlign:"center", fontSize:12, color:"#475569" }}>
          {mode==="login" ? "Novo membro? " : "Já tem conta? "}
          <button style={s.link} onClick={()=>setMode(mode==="login"?"register":"login")}>
            {mode==="login" ? "Criar conta" : "Fazer login"}
          </button>
        </p>
      </div>
    </div>
  );
}
