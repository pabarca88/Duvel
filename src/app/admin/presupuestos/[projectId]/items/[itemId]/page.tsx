import Link from "next/link";
import { notFound } from "next/navigation";
import { createDocumentRequirement, deleteDocumentRequirement, updateConfiguredBudgetItem } from "../../../../actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { createClient } from "@/lib/supabase/server";

const categories = ["RRHH", "OPERACIONES", "ADMINISTRACIÓN", "INVERSIÓN"] as const;
type Category = typeof categories[number];
const images: Record<Category, string> = { RRHH: "rrhh", OPERACIONES: "invoice", ADMINISTRACIÓN: "administracion", INVERSIÓN: "invoice" };

export default async function EditBudgetItemPage({ params }: { params: Promise<{ projectId: string; itemId: string }> }) {
  const { projectId, itemId } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: item }] = await Promise.all([
    supabase.from("projects").select("name, code").eq("id", projectId).single(),
    supabase.from("budget_items").select("id, category_id, name, subsidy_amount, company_amount, tax_id, monthly_hours").eq("id", itemId).single(),
  ]);
  if (!project || !item) notFound();
  const { data: category } = await supabase.from("budget_categories").select("project_id, name").eq("id", item.category_id).single();
  if (!category || category.project_id !== projectId || !categories.includes(category.name as Category)) notFound();
  const { data: requirements } = await supabase.from("document_requirements").select("id, name, required, requires_validity_period").eq("budget_item_id", item.id).order("name");
  const categoryName = category.name as Category;
  const subsidy = Number(item.subsidy_amount ?? 0); const company = Number(item.company_amount ?? 0);

  return <><div className="titlebar">EDITAR ÍTEM {categoryName}</div><main className="page"><div className="container grid-2 item-create-layout"><div><form action={updateConfiguredBudgetItem.bind(null, item.id)} className="form-card item-create-form"><div className="item-form-heading"><p className="eyebrow">{project.name} · {project.code}</p><h1>Editar ítem</h1><p>Actualiza los montos o datos del ítem. El total se recalcula automáticamente.</p></div><div className="form-grid"><div className="field wide"><label>{categoryName === "RRHH" ? "Nombre RRHH" : "Nombre del ítem"}</label><input name="name" required maxLength={160} defaultValue={item.name} /></div>{categoryName === "RRHH" && <><div className="field"><label>RUT</label><input name="tax_id" required maxLength={20} defaultValue={item.tax_id ?? ""} /></div><div className="field"><label>Horas mensuales a trabajar</label><input name="monthly_hours" type="number" min="1" max="165" required defaultValue={item.monthly_hours ?? ""} /></div></>}<div className="field"><label>Monto total subsidio</label><input name="subsidy_amount" type="number" min="0" defaultValue={subsidy} required /></div><div className="field"><label>Monto total empresa</label><input name="company_amount" type="number" min="0" defaultValue={company} required /></div></div><div className="actions"><Link className="back" href={`/admin/presupuestos/${projectId}`}>Cancelar</Link><button className="btn">Guardar cambios</button></div></form><section className="form-card requirements-card"><h2>Respaldos requeridos</h2><p>Define los documentos que deberá adjuntar el cliente para rendir este ítem.</p><div className="requirements-list">{requirements?.map(requirement => <div key={requirement.id}><span><strong>{requirement.name}</strong>{requirement.requires_validity_period && " · requiere vigencia"}</span><ConfirmSubmit action={deleteDocumentRequirement.bind(null, requirement.id, item.id)} message={`¿Eliminar el requisito ${requirement.name}?`}>Eliminar</ConfirmSubmit></div>)}{!requirements?.length && <p className="empty">Sin respaldos configurados.</p>}</div><form action={createDocumentRequirement.bind(null, item.id)} className="requirement-form"><input name="name" required maxLength={120} placeholder="Ej.: Boleta de honorarios" /><label><input name="requires_validity_period" type="checkbox" /> Requiere vigencia</label><button className="btn btn-sm">Agregar respaldo</button></form></section></div><img className="illus item-create-image" src={`/assets/images/${images[categoryName]}.jpg`} alt={`Editar ${categoryName}`} /></div></main></>;
}
