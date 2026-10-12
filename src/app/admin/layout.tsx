import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile || !["admin", "superadmin"].includes(profile.role)) redirect("/login?error=unauthorized");
  return <><div className="topbar"><div className="socials"><span>t</span><span>f</span><span>◎</span><span>▶</span><span>p</span></div><div className="phone">+56 9 0000 0000</div></div><header className="navbar"><Link className="brand" href="/admin/empresas"><span className="brand-mark">DV</span><span className="brand-copy"><strong>DUVEL</strong><small>CONSULTING</small></span></Link><nav className="navlinks"><Link href="/">INICIO</Link><Link href="/admin/empresas">EMPRESAS</Link><Link href="/admin/proyectos">PROYECTOS</Link><Link href="/admin/presupuestos">PRESUPUESTOS</Link><Link href="/admin/rendiciones">RENDICIONES</Link></nav></header>{children}<footer className="footer"><div className="container"><div className="footer-grid"><Link className="brand" href="/admin"><span className="brand-mark">DV</span><span className="brand-copy"><strong>DUVEL</strong><small>CONSULTING</small></span></Link><div><h4>Plataforma</h4><Link href="/admin/empresas">Mis empresas</Link><Link href="/admin/proyectos">Mis proyectos</Link></div><div><h4>Sesión</h4><span>{profile.full_name}</span><span>Administrador</span></div><div><h4>Ayuda</h4><span>Preguntas frecuentes</span><span>Contacto</span></div></div><div className="copyright">© 2026 Duvel Consulting</div></div></footer></>;
}
