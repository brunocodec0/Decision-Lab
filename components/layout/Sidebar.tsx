"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="url(#sl)"/>
      <circle cx="10" cy="22" r="3.5" fill="white" fillOpacity=".95"/>
      <circle cx="22" cy="10" r="3.5" fill="white" fillOpacity=".95"/>
      <line x1="12.5" y1="19.5" x2="19.5" y2="12.5" stroke="white" strokeOpacity=".5" strokeWidth="1.5"/>
      <circle cx="22" cy="10" r="1.5" fill="#50d9c9"/>
      <defs>
        <linearGradient id="sl" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#690a96"/>
          <stop offset="1" stopColor="#4a0870"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const NAV = [
  { href:"/",              label:"Dashboard"     },
  { href:"/simulator",     label:"Simulador"     },
  { href:"/scenarios",     label:"Cenários"      },
  { href:"/ai-advisor",    label:"IA Consultora" },
  { href:"/history",       label:"Histórico"     },
];

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    toast.success("Sessão encerrada");
  };

  const initials = userName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

  return (
    <aside style={{
      width:210, display:"flex", flexDirection:"column",
      background:"#0f0f18", borderRight:"1px solid #1e1e32", flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{ height:58, display:"flex", alignItems:"center", gap:10,
        padding:"0 18px", borderBottom:"1px solid #1e1e32" }}>
        <Logo/>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"#f1f0f5", lineHeight:1 }}>DecisionLab</p>
          <p style={{ fontSize:9, color:"#690a96", letterSpacing:.7, marginTop:3 }}>INICIATIVA CONSULTORIA</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:10, display:"flex", flexDirection:"column", gap:1 }}>
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
              borderRadius:8, textDecoration:"none",
              background: active ? "#690a9618" : "transparent",
              color: active ? "#50d9c9" : "#94a3b8",
              fontSize:13, fontWeight: active ? 600 : 400,
              transition:"all .15s",
            }}>
              {label}
              {active && <div style={{ marginLeft:"auto", width:4, height:4, borderRadius:"50%", background:"#690a96" }}/>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding:14, borderTop:"1px solid #1e1e32" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
          <div style={{ width:28, height:28, borderRadius:"50%",
            background:"linear-gradient(135deg,#690a96,#50d9c9)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, color:"#f1f0f5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userName}</p>
            <p style={{ fontSize:10, color:"#475569" }}>J. Financeiro</p>
          </div>
        </div>
        <button onClick={logout} style={{
          width:"100%", background:"transparent", border:"1px solid #1e1e32",
          borderRadius:7, padding:"7px 10px", fontSize:11, color:"#475569",
          cursor:"pointer", textAlign:"left", transition:"all .15s",
        }}>Sair da plataforma</button>
      </div>
    </aside>
  );
}
