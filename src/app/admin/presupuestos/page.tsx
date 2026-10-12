import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name, code, companies(name)").eq("active", true).order("name");
  return <section className="mx-auto max-w-7xl px-6 py-10"><p className="text-sm font-semibold tracking-[0.2em] text-[#b46c42]">CONFIGURACIÓN</p><h1 className="mt-3 text-3xl font-semibold">Presupuestos</h1><p className="mt-2 text-[#52615f]">Selecciona un proyecto para definir sus categorías e ítems financiables.</p><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects?.map(project => <Link key={project.id} href={`/admin/presupuestos/${project.id}`} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-[#b46c42]"><p className="text-sm text-[#64726f]">{project.companies?.[0]?.name}</p><h2 className="mt-2 text-lg font-semibold">{project.name}</h2><p className="mt-2 text-sm text-[#b46c42]">{project.code} · Configurar →</p></Link>)}{!projects?.length && <p className="rounded-2xl bg-white p-8 text-[#64726f]">Aún no hay proyectos activos.</p>}</div></section>;
}
