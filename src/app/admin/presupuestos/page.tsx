import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name, code, companies(name)").eq("active", true).order("name");
  return <><div className="titlebar">CONFIGURACIÓN DEL PRESUPUESTO</div><main className="page"><div className="container"><div className="toolbar"><div className="toolbar-group"><Link className="back" href="/admin/proyectos">Retroceder</Link></div><div className="toolbar-group"><Link className="btn" href="/admin/rendiciones">Ver documentos rendidos</Link></div></div><div className="budget-grid">{projects?.map(project => <Link key={project.id} href={`/admin/presupuestos/${project.id}`} className="budget-card"><header><h3>{project.name}</h3><span className="btn btn-sm">Configurar</span></header><div className="empty">{project.companies?.[0]?.name}<br /><strong>{project.code}</strong></div></Link>)}</div>{!projects?.length && <p className="empty">Crea un proyecto antes de configurar su presupuesto.</p>}</div></main></>;
}
