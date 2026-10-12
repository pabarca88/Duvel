import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const links = [["Resumen", "/admin"], ["Empresas", "/admin/empresas"], ["Proyectos", "/admin/proyectos"], ["Presupuestos", "/admin/presupuestos"], ["Rendiciones", "/admin/rendiciones"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile || !["admin", "superadmin"].includes(profile.role)) redirect("/login?error=unauthorized");
  return <main className="min-h-screen bg-[#f5f6f3] text-[#1e2d2b]"><header className="border-b border-[#d9e0dc] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><Link href="/admin" className="font-semibold tracking-[0.18em] text-[#1e2d2b]">DUVEL <span className="font-normal text-[#b46c42]">CONSULTING</span></Link><div className="text-right text-sm"><p className="font-semibold">{profile.full_name}</p><p className="text-[#64726f]">Administrador</p></div></div><nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">{links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium text-[#40514e] hover:bg-[#f3f6f3] hover:text-[#b46c42]">{label}</Link>)}</nav></header>{children}</main>;
}
