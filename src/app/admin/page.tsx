import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ count: companies }, { count: projects }, { count: expenses }] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("expenses").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review", "observed"]),
  ]);
  const cards: Array<[string, number, string, string]> = [["Empresas", companies ?? 0, "Administra las organizaciones y sus datos tributarios.", "/admin/empresas"], ["Proyectos", projects ?? 0, "Crea proyectos y conéctalos con cada empresa.", "/admin/proyectos"], ["Rendiciones pendientes", expenses ?? 0, "Revisa documentos y deja observaciones.", "/admin/rendiciones"]];
  return <section className="mx-auto max-w-7xl px-6 py-10"><p className="text-sm font-semibold tracking-[0.2em] text-[#b46c42]">ADMINISTRACIÓN</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Panel de gestión</h1><p className="mt-3 max-w-2xl text-[#52615f]">Configura la estructura de cada proyecto antes de que el cliente comience a rendir gastos.</p><div className="mt-9 grid gap-5 md:grid-cols-3">{cards.map(([title, amount, text, href]) => <Link key={href} href={href} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-sm font-medium text-[#b46c42]">{title}</p><p className="mt-3 text-4xl font-semibold">{amount}</p><p className="mt-4 text-sm leading-6 text-[#52615f]">{text}</p><span className="mt-5 inline-block text-sm font-semibold text-[#1e2d2b]">Gestionar →</span></Link>)}</div><div className="mt-8 rounded-2xl border border-[#d9e0dc] bg-[#edf3f0] p-6"><h2 className="font-semibold">Flujo recomendado</h2><p className="mt-2 text-sm text-[#52615f]">1. Crea una empresa · 2. Crea su proyecto · 3. Define el presupuesto y los ítems · 4. Revisa las rendiciones enviadas.</p></div></section>;
}
