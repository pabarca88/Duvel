import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { downloadClientDocument } from "../actions";

const labels: Record<string, string> = { draft: "Borrador", submitted: "Enviada", under_review: "En revisión", observed: "Observada", approved: "Aprobada", rejected: "Rechazada" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ClientExpensesPage({ searchParams }: { searchParams: Promise<{ project?: string; created?: string }> }) {
  const { project, created } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase.from("expenses").select("id, project_id, description, amount, expense_date, status, projects(name, code), budget_items(name), expense_documents(id, original_name, label)").eq("submitted_by", user!.id).order("created_at", { ascending: false });
  if (project && uuid.test(project)) query = query.eq("project_id", project);
  const { data: expenses } = await query;
  const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const backHref = project && uuid.test(project) ? `/cliente/proyectos/${project}` : "/cliente";
  return <><div className="titlebar">DOCUMENTOS RENDIDOS</div><main className="page"><div className="container client-expenses"><div className="toolbar"><Link className="back" href={backHref}>{project ? "Volver al proyecto" : "Mis proyectos"}</Link>{project && <Link className="btn btn-sm" href="/cliente/rendiciones">Ver todas</Link>}</div>{created === "1" && <div className="client-success" role="status">✓ El gasto fue cargado correctamente y ya está disponible para revisión.</div>}<div className="review-list">{expenses?.map(expense => <article key={expense.id} className="review-item"><div className="review-head"><div><strong>{expense.description}</strong><span className="admin-project-meta">{expense.projects?.[0]?.name} · {expense.budget_items?.[0]?.name} · {expense.expense_date}</span></div><div className="toolbar-group"><strong>{money.format(Number(expense.amount))}</strong><span className="status-pill">{labels[expense.status] ?? expense.status}</span></div></div><div className="client-document-list"><strong>Respaldos</strong>{expense.expense_documents?.length ? expense.expense_documents.map(document => <form key={document.id} action={downloadClientDocument.bind(null, document.id)}><span>{document.label ? `${document.label}: ` : ""}{document.original_name}</span><button className="client-download" title={`Descargar ${document.original_name}`} aria-label={`Descargar ${document.original_name}`}>Descargar</button></form>) : <span className="admin-project-meta">Sin respaldos adjuntos.</span>}</div></article>)}{!expenses?.length && <p className="empty">No hay gastos rendidos todavía.</p>}</div></div></main></>;
}
