import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ClientProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = await supabase.from("project_members").select("projects(id, name, code, companies(name))").eq("user_id", user!.id);
  const projects = memberships?.flatMap(membership => Array.isArray(membership.projects) ? membership.projects : membership.projects ? [membership.projects] : []) ?? [];
  return <><div className="titlebar">MIS PROYECTOS</div><main className="page"><div className="container client-projects"><div className="client-intro"><h1>Selecciona un proyecto</h1><p>Consulta su presupuesto y registra los gastos asociados a los ítems que te fueron asignados.</p></div><div className="client-project-grid">{projects.map(project => <Link key={project.id} href={`/cliente/proyectos/${project.id}`} className="client-project-card"><span className="client-project-icon">▣</span><strong>{project.name}</strong><span>{project.companies?.[0]?.name}</span><small>{project.code}</small><b>Ver presupuesto →</b></Link>)}</div>{!projects.length && <p className="empty">Aún no tienes proyectos asignados. Contacta a Duvel para habilitar tu acceso.</p>}</div></main></>;
}
