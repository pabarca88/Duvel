import Link from "next/link";
import { createProject } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { empresa } = await searchParams;
  const supabase = await createClient();
  const [{ data: companies }, { data: projects }] = await Promise.all([supabase.from("companies").select("id, name").eq("active", true).order("name"), supabase.from("projects").select("id, name, code, company_id, companies(name)").eq("active", true).order("name")]);
  const visible = empresa ? projects?.filter(project => project.company_id === empresa) : projects;
  return <><div className="titlebar">MIS PROYECTOS</div><main className="page"><div className="container grid-2"><div><div className="eyebrow">Selecciona un proyecto</div><div className="select-list">{visible?.map(project => <Link key={project.id} href={`/admin/presupuestos/${project.id}`} className="select-card">{project.name}<small className="admin-project-meta">{project.companies?.[0]?.name} · {project.code}</small></Link>)}{!visible?.length && <p className="empty">No hay proyectos para esta empresa.</p>}</div><div className="actions"><Link className="back" href="/admin/empresas">Retroceder</Link></div><details className="admin-details"><summary>+ Crear proyecto</summary><form action={createProject} className="form-card admin-form"><div className="field"><label>Empresa</label><select name="company_id" required defaultValue={empresa ?? ""}><option value="">Seleccionar empresa</option>{companies?.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div><div className="field"><label>Nombre del proyecto</label><input name="name" required placeholder="Transformación Digital" /></div><div className="field"><label>Código</label><input name="code" required placeholder="TD-2026-01" /></div><button className="btn" disabled={!companies?.length}>Crear proyecto</button></form></details></div><img className="illus" src="/assets/images/empresas.jpg" alt="Selección de proyecto" /></div></main></>;
}
