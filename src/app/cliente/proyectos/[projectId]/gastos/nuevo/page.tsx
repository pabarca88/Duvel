import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "./expense-form";

export default async function NewExpensePage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ category?: string; item?: string }> }) {
  const { projectId } = await params;
  const { category, item } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = await supabase.from("project_members").select("projects(name, code)").eq("project_id", projectId).eq("user_id", user!.id).maybeSingle();
  const project = Array.isArray(membership?.projects) ? membership.projects[0] : membership?.projects;
  if (!project) notFound();
  const { data: configuredCategories } = await supabase.from("budget_categories").select("name, budget_items(id, name)").eq("project_id", projectId).order("position");
  const items = configuredCategories?.flatMap(entry => (entry.budget_items ?? []).map(budgetItem => ({ id: budgetItem.id, name: budgetItem.name, category: entry.name }))) ?? [];
  return <><div className="titlebar">CARGAR GASTO</div><main className="page"><div className="container grid-2 item-create-layout"><ExpenseForm projectId={projectId} items={items} initialCategory={category} initialItem={item} /><img className="illus item-create-image" src="/assets/images/documentos.jpg" alt="Carga de respaldos" /></div></main></>;
}
