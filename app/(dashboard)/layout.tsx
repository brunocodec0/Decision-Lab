import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#09090f" }}>
      <Sidebar userName={profile?.full_name || user.email || "Membro"} />
      <main style={{ flex:1, overflow:"auto", padding:"28px 32px" }}>
        {children}
      </main>
    </div>
  );
}
