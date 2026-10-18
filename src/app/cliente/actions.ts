"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDownloadUrl, deleteDocuments, documentKey, uploadDocument } from "@/lib/storage/r2";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxFileSize = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const categories = ["RRHH", "OPERACIONES", "ADMINISTRACIÓN", "INVERSIÓN"] as const;
type Category = typeof categories[number];
const documentTypes = ["boleta", "factura", "factura_compra", "honorarios", "sueldo", "invoice"] as const;

const documentRules: Record<Category, readonly string[]> = {
  RRHH: ["sueldo", "honorarios", "invoice"],
  OPERACIONES: documentTypes.filter(type => type !== "sueldo"),
  ADMINISTRACIÓN: ["invoice", "honorarios", "factura", "factura_compra"],
  INVERSIÓN: ["invoice", "factura", "factura_compra"],
};

const documentLabels: Record<string, string> = {
  boleta: "Boleta",
  factura: "Factura",
  honorarios: "Boleta de honorarios",
  sueldo: "Liquidación de sueldo",
  invoice: "Invoice",
  factura_compra: "Factura de compra",
};

function requiredFileNames(type: string) {
  if (type === "honorarios") return ["Boleta de honorarios", "Comprobante de pago o cartola", "Informe de boletas recibidas SII", "F29 del mes de la boleta"];
  if (type === "sueldo") return ["Liquidación de sueldo", "Comprobante de pago o cartola", "Certificado de pago de cotizaciones"];
  if (type === "invoice") return ["Documento tributario", "Comprobante de pago o cartola", "Invoice"];
  if (type === "factura_compra") return ["Invoice"];
  return ["Documento tributario", "Comprobante de pago o cartola"];
}

function formText(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

async function clientContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || ["admin", "superadmin"].includes(profile.role)) throw new Error("Esta acción solo está disponible para clientes.");
  return { supabase, user };
}

export async function createClientExpense(formData: FormData) {
  const projectId = formText(formData, "project_id", 50);
  const itemId = formText(formData, "item_id", 50);
  const documentType = formText(formData, "document_type", 30);
  const descriptionInput = formText(formData, "description", 500);
  const amount = Number(formData.get("amount"));
  const expenseDate = formText(formData, "expense_date", 10);
  const invoiceMetadata = {
    invoice_type: formText(formData, "invoice_type", 80),
  };
  if (!uuid.test(projectId) || !uuid.test(itemId)) throw new Error("Proyecto o ítem inválido.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999 || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) throw new Error("Completa el monto y la fecha de pago.");

  const { supabase, user } = await clientContext();
  const { data: membership } = await supabase.from("project_members").select("project_id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle();
  if (!membership) throw new Error("No tienes acceso a este proyecto.");

  const { data: item } = await supabase.from("budget_items").select("id, category_id, budget_categories!inner(project_id, name, projects!inner(company_id))").eq("id", itemId).maybeSingle();
  const category = item?.budget_categories as unknown as { project_id: string; name: Category; projects: { company_id: string } | { company_id: string }[] } | null;
  if (!item || !category || category.project_id !== projectId || !categories.includes(category.name)) throw new Error("El ítem no corresponde al proyecto seleccionado.");
  if (!documentRules[category.name].includes(documentType)) throw new Error("Ese tipo de documento no está permitido para esta categoría.");
  if (documentType === "invoice" && !invoiceMetadata.invoice_type) throw new Error("Selecciona el tipo de invoice.");
  const description = descriptionInput || `${documentLabels[documentType]} - ítem rendido`;

  const expectedFiles = requiredFileNames(documentType);
  const uploadFiles = expectedFiles.map((label, index) => ({ label, file: formData.get(`file_${index}`) })).map(({ label, file }) => {
    if (!(file instanceof File) || file.size === 0) throw new Error(`Adjunta: ${label}.`);
    if (file.size > maxFileSize) throw new Error(`${label} supera el límite de 5 MB.`);
    if (!allowedMimeTypes.has(file.type)) throw new Error(`${label} debe ser PDF, JPG o PNG.`);
    return { label, file };
  });
  const optionalFile = formData.get("file_optional");
  if (optionalFile instanceof File && optionalFile.size > 0) {
    if (optionalFile.size > maxFileSize) throw new Error("El documento adicional supera el límite de 5 MB.");
    if (!allowedMimeTypes.has(optionalFile.type)) throw new Error("El documento adicional debe ser PDF, JPG o PNG.");
    uploadFiles.push({ label: formText(formData, "optional_label", 120) || "Otro tipo de documento", file: optionalFile });
  }

  const { data: expense, error: expenseError } = await supabase.from("expenses").insert({ project_id: projectId, budget_item_id: itemId, submitted_by: user.id, description, amount, expense_date: expenseDate, status: "draft", metadata: { document_type: documentType, document_label: documentLabels[documentType], invoice: documentType === "invoice" ? invoiceMetadata : undefined } }).select("id").single();
  if (expenseError || !expense) throw new Error(expenseError?.message ?? "No fue posible crear la rendición.");

  const projectRelation = category.projects;
  const companyId = Array.isArray(projectRelation) ? projectRelation[0]?.company_id : projectRelation?.company_id;
  if (!companyId) throw new Error("No fue posible identificar la empresa del proyecto.");
  const uploadedKeys: string[] = [];
  try {
    const documents = [];
    for (const { label, file } of uploadFiles) {
      const key = documentKey(companyId, projectId, expense.id, file.name);
      await uploadDocument(key, new Uint8Array(await file.arrayBuffer()), file.type);
      uploadedKeys.push(key);
      documents.push({ expense_id: expense.id, storage_key: key, original_name: file.name.slice(0, 255), mime_type: file.type, byte_size: file.size, label, status: "uploaded" });
    }
    const { error: documentsError } = await supabase.from("expense_documents").insert(documents);
    if (documentsError) throw new Error(documentsError.message);
    const { error: updateError } = await supabase.from("expenses").update({ status: "submitted" }).eq("id", expense.id).eq("submitted_by", user.id);
    if (updateError) throw new Error(updateError.message);
  } catch (error) {
    await deleteDocuments(uploadedKeys).catch(() => undefined);
    await supabase.from("expenses").delete().eq("id", expense.id).eq("submitted_by", user.id);
    throw error;
  }
  revalidatePath(`/cliente/proyectos/${projectId}`);
  revalidatePath("/cliente/rendiciones");
  redirect(`/cliente/rendiciones?project=${projectId}&created=1`);
}

export async function downloadClientDocument(documentId: string) {
  if (!uuid.test(documentId)) throw new Error("Documento inválido.");
  const { supabase, user } = await clientContext();
  const { data: document } = await supabase.from("expense_documents").select("storage_key, expenses!inner(project_id)").eq("id", documentId).maybeSingle();
  const projectId = (document?.expenses as unknown as { project_id: string }[] | null)?.[0]?.project_id;
  if (!document || !projectId) throw new Error("Documento no encontrado.");
  const { data: membership } = await supabase.from("project_members").select("project_id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle();
  if (!membership) throw new Error("No tienes acceso a este documento.");
  redirect(await createDownloadUrl(document.storage_key));
}

export async function logoutClient() {
  const { supabase } = await clientContext();
  await supabase.auth.signOut();
  redirect("/login");
}
