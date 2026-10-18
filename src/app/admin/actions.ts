"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createDownloadUrl } from "@/lib/storage/r2";

const budgetCategories = ["RRHH", "OPERACIONES", "ADMINISTRACIÓN", "INVERSIÓN"] as const;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const value = (formData: FormData, key: string, max = 160) => String(formData.get(key) ?? "").trim().slice(0, max);
const idValue = (input: string) => { if (!uuid.test(input)) throw new Error("Identificador inválido"); return input; };
const amountValue = (formData: FormData, key: string) => { const amount = Number(formData.get(key)); if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999) throw new Error("El monto no es válido"); return amount; };

async function adminClient() { return (await requireAdmin()).supabase; }

export async function createCompany(formData: FormData) {
  const name = value(formData, "name");
  const taxId = value(formData, "tax_id", 20);
  if (!name) throw new Error("El nombre de la empresa es obligatorio");
  const supabase = await adminClient();
  const { error } = await supabase.from("companies").insert({ name, tax_id: taxId || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin"); revalidatePath("/admin/empresas"); revalidatePath("/admin/proyectos");
}

export async function updateCompany(companyId: string, formData: FormData) {
  const id = idValue(companyId); const name = value(formData, "name"); const taxId = value(formData, "tax_id", 20);
  if (!name) throw new Error("La razón social es obligatoria");
  const { error } = await (await adminClient()).from("companies").update({ name, tax_id: taxId || null }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/admin/empresas"); revalidatePath("/admin/proyectos");
}

export async function archiveCompany(companyId: string) {
  const id = idValue(companyId); const { error } = await (await adminClient()).from("companies").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/admin/empresas"); revalidatePath("/admin/proyectos");
}

export async function createProject(formData: FormData) {
  const companyId = idValue(value(formData, "company_id", 50));
  const name = value(formData, "name");
  const code = value(formData, "code", 40).toUpperCase();
  if (!companyId || !name || !code) throw new Error("Completa empresa, nombre y código del proyecto");
  const supabase = await adminClient();
  const { data: project, error } = await supabase.from("projects").insert({ company_id: companyId, name, code }).select("id").single();
  if (error) throw new Error(error.message);
  const { error: categoriesError } = await supabase.from("budget_categories").insert(budgetCategories.map((category, position) => ({ project_id: project.id, name: category, position })));
  if (categoriesError) throw new Error(categoriesError.message);
  revalidatePath("/admin"); revalidatePath("/admin/proyectos"); revalidatePath("/admin/presupuestos");
}

export async function updateProject(projectId: string, formData: FormData) {
  const id = idValue(projectId); const name = value(formData, "name"); const code = value(formData, "code", 40).toUpperCase();
  if (!name || !code) throw new Error("Completa nombre y código del proyecto");
  const { error } = await (await adminClient()).from("projects").update({ name, code }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/admin/proyectos"); revalidatePath("/admin/presupuestos");
}

export async function archiveProject(projectId: string) {
  const id = idValue(projectId); const { error } = await (await adminClient()).from("projects").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/admin/proyectos"); revalidatePath("/admin/presupuestos");
}

export async function assignClientToProject(projectId: string, formData: FormData) {
  const projectIdValue = idValue(projectId);
  const clientId = idValue(value(formData, "client_id", 50));
  const supabase = await adminClient();
  const [{ data: project }, { data: client }] = await Promise.all([
    supabase.from("projects").select("id").eq("id", projectIdValue).eq("active", true).maybeSingle(),
    supabase.from("profiles").select("id, role").eq("id", clientId).maybeSingle(),
  ]);
  if (!project) throw new Error("Proyecto no encontrado o archivado.");
  if (!client || client.role !== "client") throw new Error("Selecciona una cuenta de cliente válida.");
  const { error } = await supabase.from("project_members").upsert({ project_id: project.id, user_id: client.id, role: "client" }, { onConflict: "project_id,user_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/proyectos/${project.id}/clientes`); revalidatePath("/admin/proyectos"); revalidatePath("/cliente");
}

export async function removeClientFromProject(projectId: string, clientId: string) {
  const projectIdValue = idValue(projectId); const userId = idValue(clientId);
  const supabase = await adminClient();
  const { data: membership } = await supabase.from("project_members").select("project_id, profiles(role)").eq("project_id", projectIdValue).eq("user_id", userId).maybeSingle();
  const profile = membership?.profiles as unknown as { role: string } | { role: string }[] | null;
  const role = Array.isArray(profile) ? profile[0]?.role : profile?.role;
  if (!membership || role !== "client") throw new Error("La asignación de cliente no existe.");
  const { error } = await supabase.from("project_members").delete().eq("project_id", projectIdValue).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/proyectos/${projectIdValue}/clientes`); revalidatePath("/admin/proyectos"); revalidatePath("/cliente");
}

export async function createConfiguredBudgetItem(formData: FormData) {
  const projectId = idValue(value(formData, "project_id", 50));
  const categoryName = value(formData, "category_name", 30);
  const name = value(formData, "name");
  const subsidyAmount = amountValue(formData, "subsidy_amount");
  const companyAmount = amountValue(formData, "company_amount");
  const taxId = value(formData, "tax_id", 20);
  const monthlyHoursValue = value(formData, "monthly_hours", 6);
  const monthlyHours = monthlyHoursValue ? Number(monthlyHoursValue) : null;

  if (!projectId || !budgetCategories.includes(categoryName as typeof budgetCategories[number]) || !name || !Number.isFinite(subsidyAmount) || subsidyAmount < 0 || !Number.isFinite(companyAmount) || companyAmount < 0) throw new Error("Completa correctamente los datos del ítem");
  if (categoryName === "RRHH" && (!taxId || !Number.isInteger(monthlyHours) || (monthlyHours ?? 0) < 1 || (monthlyHours ?? 0) > 165)) throw new Error("RRHH requiere RUT y entre 1 y 165 horas mensuales");

  const supabase = await adminClient();
  let { data: category, error: categoryError } = await supabase.from("budget_categories").select("id").eq("project_id", projectId).eq("name", categoryName).maybeSingle();
  if (categoryError) throw new Error(categoryError.message);
  if (!category) {
    const position = budgetCategories.indexOf(categoryName as typeof budgetCategories[number]);
    const result = await supabase.from("budget_categories").insert({ project_id: projectId, name: categoryName, position }).select("id").single();
    category = result.data;
    categoryError = result.error;
  }
  if (categoryError || !category) throw new Error(categoryError?.message ?? "No se pudo crear la categoría");
  const itemPayload = {
    category_id: category.id,
    name,
    allocated_amount: subsidyAmount + companyAmount,
    subsidy_amount: subsidyAmount,
    company_amount: companyAmount,
    funding_source: subsidyAmount > 0 && companyAmount > 0 ? "both" : subsidyAmount > 0 ? "subsidy" : companyAmount > 0 ? "company" : null,
    tax_id: categoryName === "RRHH" ? taxId : null,
    monthly_hours: categoryName === "RRHH" ? monthlyHours : null,
  };
  const { error } = await supabase.from("budget_items").insert(itemPayload);
  if (error?.code === "PGRST204") throw new Error("La base de datos requiere la migración 202610150001_budget_item_accounts.sql antes de crear ítems.");
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/presupuestos/${projectId}`);
  redirect(`/admin/presupuestos/${projectId}`);
}

async function itemContext(itemId: string) {
  const supabase = await adminClient();
  const { data: item, error: itemError } = await supabase.from("budget_items").select("id, category_id").eq("id", idValue(itemId)).single();
  if (itemError || !item) throw new Error("Ítem no encontrado");
  const { data: category, error: categoryError } = await supabase.from("budget_categories").select("project_id, name").eq("id", item.category_id).single();
  if (categoryError || !category || !budgetCategories.includes(category.name as typeof budgetCategories[number])) throw new Error("Categoría no válida");
  return { supabase, item, category: { ...category, name: category.name as typeof budgetCategories[number] } };
}

export async function updateConfiguredBudgetItem(itemId: string, formData: FormData) {
  const { supabase, item, category } = await itemContext(itemId);
  const name = value(formData, "name"); const subsidyAmount = amountValue(formData, "subsidy_amount"); const companyAmount = amountValue(formData, "company_amount");
  const taxId = value(formData, "tax_id", 20); const hoursRaw = value(formData, "monthly_hours", 6); const monthlyHours = hoursRaw ? Number(hoursRaw) : null;
  if (!name) throw new Error("El nombre del ítem es obligatorio");
  if (category.name === "RRHH" && (!taxId || !Number.isInteger(monthlyHours) || (monthlyHours ?? 0) < 1 || (monthlyHours ?? 0) > 165)) throw new Error("RRHH requiere RUT y entre 1 y 165 horas mensuales");
  const { error } = await supabase.from("budget_items").update({ name, allocated_amount: subsidyAmount + companyAmount, subsidy_amount: subsidyAmount, company_amount: companyAmount, funding_source: subsidyAmount > 0 && companyAmount > 0 ? "both" : subsidyAmount > 0 ? "subsidy" : companyAmount > 0 ? "company" : null, tax_id: category.name === "RRHH" ? taxId : null, monthly_hours: category.name === "RRHH" ? monthlyHours : null }).eq("id", item.id);
  if (error) throw new Error(error.code === "PGRST204" ? "La base de datos requiere la migración de cuentas antes de editar ítems." : error.message);
  revalidatePath(`/admin/presupuestos/${category.project_id}`); redirect(`/admin/presupuestos/${category.project_id}`);
}

export async function deleteBudgetItem(itemId: string) {
  const { supabase, item, category } = await itemContext(itemId);
  const { data: expense } = await supabase.from("expenses").select("id").eq("budget_item_id", item.id).limit(1).maybeSingle();
  if (expense) throw new Error("No puedes eliminar un ítem que tiene rendiciones. Archiva o resuelve sus rendiciones primero.");
  const { error } = await supabase.from("budget_items").delete().eq("id", item.id);
  if (error) throw new Error(error.message); revalidatePath(`/admin/presupuestos/${category.project_id}`);
}

export async function duplicateBudgetItem(itemId: string) {
  const { supabase, item, category } = await itemContext(itemId);
  const { data: source, error: sourceError } = await supabase.from("budget_items").select("name, allocated_amount, subsidy_amount, company_amount, funding_source, tax_id, monthly_hours").eq("id", item.id).single();
  if (sourceError || !source) throw new Error("No se pudo copiar el ítem. Aplica primero la migración de cuentas.");
  const { data: copy, error } = await supabase.from("budget_items").insert({ ...source, category_id: item.category_id, name: `${source.name} (copia)` }).select("id").single();
  if (error || !copy) throw new Error(error?.message ?? "No se pudo copiar el ítem");
  revalidatePath(`/admin/presupuestos/${category.project_id}`); redirect(`/admin/presupuestos/${category.project_id}/items/${copy.id}`);
}

export async function createDocumentRequirement(itemId: string, formData: FormData) {
  const { supabase, item, category } = await itemContext(itemId); const name = value(formData, "name", 120);
  const requiresValidity = formData.get("requires_validity_period") === "on";
  if (!name) throw new Error("El nombre del respaldo es obligatorio");
  const { error } = await supabase.from("document_requirements").insert({ budget_item_id: item.id, name, requires_validity_period: requiresValidity });
  if (error) throw new Error(error.message); revalidatePath(`/admin/presupuestos/${category.project_id}/items/${item.id}`);
}

export async function deleteDocumentRequirement(requirementId: string, itemId: string) {
  const { supabase, item, category } = await itemContext(itemId); const id = idValue(requirementId);
  const { data: requirement } = await supabase.from("document_requirements").select("id").eq("id", id).eq("budget_item_id", item.id).maybeSingle();
  if (!requirement) throw new Error("Requisito no encontrado");
  const { error } = await supabase.from("document_requirements").delete().eq("id", requirement.id);
  if (error) throw new Error(error.message); revalidatePath(`/admin/presupuestos/${category.project_id}/items/${item.id}`);
}

export async function logout() {
  const supabase = await adminClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function reviewExpense(expenseId: string, formData: FormData) {
  const id = idValue(expenseId); const status = value(formData, "status", 30); const comment = value(formData, "comment", 2000); const documentId = value(formData, "document_id", 50);
  if (!["under_review", "observed", "approved", "rejected"].includes(status)) throw new Error("Estado no válido");
  const { supabase, user } = await requireAdmin();
  const { data: expense, error: expenseError } = await supabase.from("expenses").select("id, project_id").eq("id", id).single();
  if (expenseError || !expense) throw new Error("Rendición no encontrada");
  if (documentId) {
    const { data: document } = await supabase.from("expense_documents").select("id").eq("id", idValue(documentId)).eq("expense_id", id).maybeSingle();
    if (!document) throw new Error("El documento no pertenece a esta rendición");
    const { error: reviewError } = await supabase.from("document_reviews").insert({ document_id: document.id, reviewer_id: user.id, status: status === "approved" ? "approved" : status === "observed" ? "observed" : status === "rejected" ? "rejected" : "pending", comment: comment || null });
    if (reviewError) throw new Error(reviewError.message);
  }
  const { error } = await supabase.from("expenses").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/rendiciones"); revalidatePath(`/admin/rendiciones/${id}`); redirect(`/admin/rendiciones/${id}`);
}

export async function downloadExpenseDocument(documentId: string) {
  const id = idValue(documentId); const supabase = await adminClient();
  const { data: document, error } = await supabase.from("expense_documents").select("storage_key").eq("id", id).single();
  if (error || !document) throw new Error("Documento no encontrado");
  redirect(await createDownloadUrl(document.storage_key));
}
