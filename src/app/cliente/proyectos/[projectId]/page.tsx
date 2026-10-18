import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const categories = ["RRHH", "OPERACIONES", "ADMINISTRACIÓN", "INVERSIÓN"] as const;

export default async function ClientProjectBudgetPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = await supabase.from("project_members").select("projects(id, name, code)").eq("project_id", projectId).eq("user_id", user!.id).maybeSingle();
  const project = Array.isArray(membership?.projects) ? membership.projects[0] : membership?.projects;
  if (!project) notFound();
  const { data: budgetCategories } = await supabase.from("budget_categories").select("id, name, budget_items(id, name, allocated_amount)").eq("project_id", projectId).order("position");
  const { data: expenses } = await supabase.from("expenses").select("budget_item_id, amount").eq("project_id", projectId).in("status", ["submitted", "observed", "approved"]);
  const rendered = new Map<string, number>();
  expenses?.forEach(expense => rendered.set(expense.budget_item_id, (rendered.get(expense.budget_item_id) ?? 0) + Number(expense.amount)));
  const total = budgetCategories?.reduce((sum, category) => sum + (category.budget_items?.reduce((itemsTotal, item) => itemsTotal + Number(item.allocated_amount), 0) ?? 0), 0) ?? 0;
  const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  return <><div className="titlebar">DATOS DEL PRESUPUESTO</div><main className="page project-budget-page"><div className="container">
    <div className="project-actions client-actions"><Link className="btn" href={`/cliente/proyectos/${projectId}/gastos/nuevo`}>Agregar gasto</Link><Link className="btn" href={`/cliente/rendiciones?project=${projectId}`}>Documentos rendidos</Link></div>
    <div className="project-context"><Link className="back" href="/cliente">Mis proyectos</Link><span><strong>{project.name}</strong> · {project.code}</span></div>
    <div className="project-budget-table-wrap"><table className="project-budget-table client-budget-table"><thead><tr><th>Gastos</th><th>Ítem</th><th>Presupuestado</th><th>Rendido</th><th>Saldo</th></tr></thead>
      {categories.map(categoryName => { const category = budgetCategories?.find(entry => entry.name === categoryName); const items = category?.budget_items ?? []; return <tbody key={categoryName}>{items.length ? items.map((item, index) => { const spent = rendered.get(item.id) ?? 0; const allocated = Number(item.allocated_amount); return <tr key={item.id}>{index === 0 && <th className="expense-category" scope="rowgroup" rowSpan={items.length}>{categoryName}</th>}<td className="budget-item-name"><strong>{item.name}</strong><Link className="client-item-action" href={`/cliente/proyectos/${projectId}/gastos/nuevo?category=${encodeURIComponent(categoryName)}&item=${item.id}`}>Cargar gasto</Link></td><td>{money.format(allocated)}</td><td className="item-rendered">{money.format(spent)}</td><td className="item-total">{money.format(Math.max(allocated - spent, 0))}</td></tr>; }) : <tr><th className="expense-category" scope="rowgroup">{categoryName}</th><td className="budget-item-empty">Aún no hay ítems</td><td>—</td><td>—</td><td>—</td></tr>}</tbody>; })}
    </table></div><div className="total-row"><span>Total proyecto</span><strong>{money.format(total)}</strong></div>
  </div></main></>;
}
