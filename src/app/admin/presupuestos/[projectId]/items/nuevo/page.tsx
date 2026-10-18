import Link from "next/link";
import { notFound } from "next/navigation";
import { createConfiguredBudgetItem } from "../../../../actions";
import { createClient } from "@/lib/supabase/server";

const categories = ["RRHH", "OPERACIONES", "ADMINISTRACIÓN", "INVERSIÓN"] as const;
type Category = typeof categories[number];

const config: Record<Category, { title: string; nameLabel: string; description: string; image: string }> = {
  RRHH: { title: "RRHH", nameLabel: "Nombre RRHH", description: "Registra los datos de la persona y los montos presupuestados.", image: "rrhh" },
  OPERACIONES: { title: "Gastos de operación", nameLabel: "Nombre del ítem", description: "Define el ítem operativo y sus montos presupuestados.", image: "invoice" },
  ADMINISTRACIÓN: { title: "Gastos de administración", nameLabel: "Nombre del ítem", description: "Registra el gasto administrativo y sus montos presupuestados.", image: "administracion" },
  INVERSIÓN: { title: "Gastos de inversión", nameLabel: "Nombre del ítem", description: "Registra el bien o recurso de inversión y sus montos presupuestados.", image: "invoice" },
};

export default async function NewBudgetItemPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ categoria?: string }> }) {
  const { projectId } = await params;
  const { categoria } = await searchParams;
  const category = categories.includes(categoria as Category) ? categoria as Category : null;
  if (!category) notFound();
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("name, code").eq("id", projectId).single();
  if (!project) notFound();
  const detail = config[category];

  return <><div className="titlebar">CONFIGURAR PRESUPUESTO {detail.title.toUpperCase()}</div><main className="page"><div className="container grid-2 item-create-layout"><form action={createConfiguredBudgetItem} className="form-card item-create-form"><div className="item-form-heading"><p className="eyebrow">{project.name} · {project.code}</p><h1>Nuevo ítem</h1><p>{detail.description}</p></div><input type="hidden" name="project_id" value={projectId} /><input type="hidden" name="category_name" value={category} /><div className="form-grid"><div className="field wide"><label>{detail.nameLabel}</label><input name="name" required placeholder="Ingresa el nombre" /></div>{category === "RRHH" && <><div className="field"><label>RUT</label><input name="tax_id" required placeholder="12.345.678-9" /></div><div className="field"><label>Horas mensuales a trabajar</label><input name="monthly_hours" type="number" min="1" max="165" required placeholder="Máximo 165 horas" /></div></>}<div className="field"><label>Monto total subsidio</label><input name="subsidy_amount" type="number" min="0" defaultValue="0" required placeholder="0" /></div><div className="field"><label>Monto total empresa</label><input name="company_amount" type="number" min="0" defaultValue="0" required placeholder="0" /></div></div><div className="actions"><Link className="back" href={`/admin/presupuestos/${projectId}`}>Retroceder</Link><button className="btn" type="submit">Crear ítem</button></div></form><img className="illus item-create-image" src={`/assets/images/${detail.image}.jpg`} alt={`Formulario de ${detail.title}`} /></div></main></>;
}
