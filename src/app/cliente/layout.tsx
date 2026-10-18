import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutClient } from "./actions";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile) redirect("/login?error=unauthorized");
  if (["admin", "superadmin"].includes(profile.role)) redirect("/admin");
  return <><div className="topbar"><div className="socials"><span>t</span><span>f</span><span>◎</span><span>▶</span><span>p</span></div><div className="phone">+56 9 0000 0000</div></div><header className="navbar"><Link className="brand" href="/cliente"><span className="brand-mark">DV</span><span className="brand-copy"><strong>DUVEL</strong><small>CONSULTING</small></span></Link><nav className="navlinks"><Link href="/cliente">MIS PROYECTOS</Link><Link href="/cliente/rendiciones">MIS RENDICIONES</Link><form action={logoutClient}><button className="nav-logout">SALIR</button></form></nav></header>{children}<footer className="footer"><div className="container"><div className="footer-grid"><Link className="brand" href="/cliente"><span className="brand-mark">DV</span><span className="brand-copy"><strong>DUVEL</strong><small>CONSULTING</small></span></Link><div><h4>Plataforma</h4><Link href="/cliente">Mis proyectos</Link><Link href="/cliente/rendiciones">Mis rendiciones</Link></div><div><h4>Sesión</h4><span>{profile.full_name}</span><span>Cliente</span><form action={logoutClient}><button className="footer-logout">Cerrar sesión</button></form></div><div><h4>Ayuda</h4><a href="mailto:contacto@duvel.cl">Contacto</a></div></div><div className="copyright">© 2026 Duvel Consulting</div></div></footer></>;
}
