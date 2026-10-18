import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const labels: Record<string, string> = { draft: "Borrador", submitted: "Enviada", under_review: "En revisión", observed: "Observada", approved: "Aprobada", rejected: "Rechazada" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ project?: string; item?: string }> }) {
  const { project, item } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("expenses").select("id, project_id, budget_item_id, description, amount, expense_date, status, projects(name), budget_items(name)").order("created_at", { ascending: false });
  if (project && uuid.test(project)) query = query.eq("project_id", project);
  if (item && uuid.test(item)) query = query.eq("budget_item_id", item);
  const { data: expenses } = await query;
  const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const backHref = project && uuid.test(project) ? `/admin/presupuestos/${project}` : "/admin/presupuestos";
  return <><div className="titlebar">DOCUMENTOS RENDIDOS</div><main className="page"><div className="container"><div className="toolbar"><Link className="back" href={backHref}>Retroceder</Link>{(project || item) && <Link className="btn btn-sm" href="/admin/rendiciones">Quitar filtros</Link>}</div><div className="review-list">{expenses?.map(expense => <Link key={expense.id} href={`/admin/rendiciones/${expense.id}`} className="review-item"><div className="review-head"><div><strong>{expense.description}</strong><span className="admin-project-meta">{expense.projects?.[0]?.name} · {expense.budget_items?.[0]?.name} · {expense.expense_date}</span></div><div className="toolbar-group"><strong>{money.format(Number(expense.amount))}</strong><span className="status-pill">{labels[expense.status] ?? expense.status}</span></div></div><div className="review-body"><span>Revisar respaldos y registrar observaciones.</span><strong>Ver detalle →</strong></div></Link>)}{!expenses?.length && <p className="empty">No hay rendiciones para los filtros seleccionados.</p>}</div></div></main></>;
}
