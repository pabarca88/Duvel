"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión no válida");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "superadmin"].includes(profile.role)) throw new Error("No tienes permisos de administrador");
  return supabase;
}

export async function createCompany(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const taxId = String(formData.get("tax_id") ?? "").trim();
  if (!name) throw new Error("El nombre de la empresa es obligatorio");
  const supabase = await adminClient();
  const { error } = await supabase.from("companies").insert({ name, tax_id: taxId || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin"); revalidatePath("/admin/empresas"); revalidatePath("/admin/proyectos");
}

export async function createProject(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!companyId || !name || !code) throw new Error("Completa empresa, nombre y código del proyecto");
  const supabase = await adminClient();
  const { error } = await supabase.from("projects").insert({ company_id: companyId, name, code });
  if (error) throw new Error(error.message);
  revalidatePath("/admin"); revalidatePath("/admin/proyectos"); revalidatePath("/admin/presupuestos");
}

export async function createBudgetCategory(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !name) throw new Error("La categoría es obligatoria");
  const supabase = await adminClient();
  const { error } = await supabase.from("budget_categories").insert({ project_id: projectId, name });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/presupuestos/${projectId}`);
}

export async function createBudgetItem(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("allocated_amount"));
  if (!projectId || !categoryId || !name || !Number.isFinite(amount) || amount < 0) throw new Error("Completa correctamente los datos del ítem");
  const supabase = await adminClient();
  const { error } = await supabase.from("budget_items").insert({ category_id: categoryId, name, allocated_amount: amount });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/presupuestos/${projectId}`);
}

export async function changeExpenseStatus(formData: FormData) {
  const id = String(formData.get("expense_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["under_review", "observed", "approved", "rejected"].includes(status)) throw new Error("Estado no válido");
  const supabase = await adminClient();
  const { error } = await supabase.from("expenses").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin"); revalidatePath("/admin/rendiciones");
}
