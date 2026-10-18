import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBudgetItem, duplicateBudgetItem } from "../../actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { createClient } from "@/lib/supabase/server";

const categories = ["RRHH", "OPERACIONES", "ADMINISTRACIÓN", "INVERSIÓN"] as const;

export default async function ProjectBudgetPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, name, code").eq("id", projectId).single();
  if (!project) notFound();
  const detail = await supabase.from("budget_categories").select("id, name, budget_items(id, name, allocated_amount, subsidy_amount, company_amount)").eq("project_id", projectId).order("position");
  const { data: budgetCategories } = detail.error ? await supabase.from("budget_categories").select("id, name, budget_items(id, name, allocated_amount)").eq("project_id", projectId).order("position") : detail;
  const { data: expenses } = await supabase.from("expenses").select("budget_item_id, amount").eq("project_id", projectId).in("status", ["submitted", "observed", "approved"]);
  const rendered = new Map<string, number>();
  expenses?.forEach(expense => rendered.set(expense.budget_item_id, (rendered.get(expense.budget_item_id) ?? 0) + Number(expense.amount)));
  const totalBudget = budgetCategories?.reduce((sum, category) => sum + (category.budget_items?.reduce((itemsTotal, item) => itemsTotal + Number(item.allocated_amount), 0) ?? 0), 0) ?? 0;
  const totalRendered = [...rendered.values()].reduce((sum, amount) => sum + amount, 0);
  const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return <><div className="titlebar">CONFIGURACIÓN DEL PRESUPUESTO</div><main className="page project-budget-page"><div className="container">
    <div className="project-actions"><Link className="btn" href={`/admin/rendiciones?project=${projectId}`}>Ver documentos rendidos</Link><Link className="btn" href="/admin/proyectos">Administrar proyecto</Link><Link className="btn" href={`/admin/presupuestos/${projectId}`}>Actualizar</Link></div>
    <div className="project-context"><Link className="back" href="/admin/presupuestos">Retroceder</Link><span><strong>{project.name}</strong> · {project.code}</span></div>
    <div className="project-budget-table-wrap"><table className="project-budget-table"><thead><tr><th rowSpan={2}>Gastos</th><th rowSpan={2}>Ítem</th><th colSpan={2}>Cuentas</th><th rowSpan={2}>Total ítem</th><th rowSpan={2}>Rendido</th></tr><tr><th>Subsidio</th><th>Empresa</th></tr></thead>
      {categories.map(categoryName => { const category = budgetCategories?.find(entry => entry.name === categoryName); const items = category?.budget_items ?? []; return <tbody key={categoryName}>{items.length ? items.map((item, index) => { const subsidy = Number(("subsidy_amount" in item ? item.subsidy_amount : undefined) ?? item.allocated_amount); const company = Number(("company_amount" in item ? item.company_amount : undefined) ?? 0); const spent = rendered.get(item.id) ?? 0; return <tr key={item.id}>{index === 0 && <th className="expense-category" scope="rowgroup" rowSpan={items.length}><span>{categoryName}</span><ItemLink projectId={projectId} categoryName={categoryName} /></th>}<td className="budget-item-name"><strong>{item.name}</strong><ItemActions projectId={projectId} itemId={item.id} itemName={item.name} /></td><td>{money.format(subsidy)}</td><td>{money.format(company)}</td><td className="item-total">{money.format(Number(item.allocated_amount))}</td><td className="item-rendered">{money.format(spent)}</td></tr>; }) : <tr><th className="expense-category" scope="rowgroup"><span>{categoryName}</span><ItemLink projectId={projectId} categoryName={categoryName} /></th><td className="budget-item-empty">Aún no hay ítems</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>}</tbody>; })}
    </table></div><div className="total-row"><span>Total presupuestado</span><strong>{money.format(totalBudget)}</strong><span>Total rendido</span><strong>{money.format(totalRendered)}</strong></div>
  </div></main></>;
}

function ItemLink({ projectId, categoryName }: { projectId: string; categoryName: typeof categories[number] }) {
  return <Link className="add-item-link" href={`/admin/presupuestos/${projectId}/items/nuevo?categoria=${encodeURIComponent(categoryName)}`}>Agregar ítem</Link>;
}

function ItemActions({ projectId, itemId, itemName }: { projectId: string; itemId: string; itemName: string }) {
  return <span className="item-icons" aria-label={`Acciones de ${itemName}`}>
    <Link href={`/admin/rendiciones?project=${projectId}&item=${itemId}`} title="Ver rendiciones" aria-label={`Ver rendiciones de ${itemName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm0 8a1 1 0 0 0 -1 1v.05a2.5 2.5 0 0 0 .5 4.95h1a.5 .5 0 1 1 0 1h-2.5a1 1 0 0 0 0 2h1a1 1 0 0 0 2 0v-.05a2.5 2.5 0 0 0 -.5 -4.95h-1a.5 .5 0 1 1 0 -1h2.5a1 1 0 0 0 0 -2h-1a1 1 0 0 0 -1 -1" /><path d="M19 7h-4l-.001 -4.001z" /></svg></Link>
    <Link href={`/admin/presupuestos/${projectId}/items/${itemId}`} title="Editar ítem" aria-label={`Editar ${itemName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" /><path d="M16 5l3 3" /></svg></Link>
    <form action={duplicateBudgetItem.bind(null, itemId)}><button title="Copiar ítem" aria-label={`Copiar ${itemName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667v-8.666" /><path d="M11 14h6" /><path d="M14 11v6" /><path d="M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg></button></form>
    <ConfirmSubmit action={deleteBudgetItem.bind(null, itemId)} message={`¿Eliminar ${itemName}? Esta acción no se puede deshacer.`} className="item-icon-danger"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg></ConfirmSubmit>
  </span>;
}
