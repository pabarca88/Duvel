import Link from "next/link";
import { changeExpenseStatus } from "../actions";
import { createClient } from "@/lib/supabase/server";

const labels: Record<string, string> = { draft: "Borrador", submitted: "Enviada", under_review: "En revisión", observed: "Observada", approved: "Aprobada", rejected: "Rechazada" };
export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: expenses } = await supabase.from("expenses").select("id, description, amount, expense_date, status, projects(name), budget_items(name)").order("created_at", { ascending: false });
  const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  return <><div className="titlebar">DOCUMENTOS RENDIDOS</div><main className="page"><div className="container"><div className="toolbar"><Link className="back" href="/admin/presupuestos">Retroceder</Link></div><div className="review-list">{expenses?.map(expense => <article key={expense.id} className="review-item"><div className="review-head"><div><strong>{expense.description}</strong><span className="admin-project-meta">{expense.projects?.[0]?.name} · {expense.budget_items?.[0]?.name} · {expense.expense_date}</span></div><div className="toolbar-group"><strong>{money.format(Number(expense.amount))}</strong><form action={changeExpenseStatus}><input type="hidden" name="expense_id" value={expense.id} /><select name="status" defaultValue={expense.status}><option value="under_review">En revisión</option><option value="observed">Observada</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option></select><button className="btn btn-sm">Guardar</button></form></div></div><div className="review-body"><span>Estado actual: <strong>{labels[expense.status] ?? expense.status}</strong></span><span className="admin-review-status">Revisa los respaldos del gasto desde el detalle.</span></div></article>)}{!expenses?.length && <p className="empty">Todavía no hay documentos rendidos.</p>}</div></div></main></>;
}
