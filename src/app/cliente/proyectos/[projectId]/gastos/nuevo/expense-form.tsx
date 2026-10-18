"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createClientExpense } from "@/app/cliente/actions";

type Item = { id: string; name: string; category: string };
type Props = { projectId: string; items: Item[]; initialCategory?: string; initialItem?: string };

const documentTypes = [{ value: "boleta", label: "Boleta" }, { value: "factura", label: "Factura" }, { value: "factura_compra", label: "Factura de compra" }, { value: "honorarios", label: "Boleta de honorarios" }, { value: "sueldo", label: "Liquidación de sueldo" }, { value: "invoice", label: "Invoice" }];
const rules: Record<string, { value: string; label: string }[]> = {
  RRHH: documentTypes.filter(type => ["sueldo", "honorarios", "invoice"].includes(type.value)),
  OPERACIONES: documentTypes.filter(type => type.value !== "sueldo"),
  ADMINISTRACIÓN: documentTypes.filter(type => ["invoice", "honorarios", "factura", "factura_compra"].includes(type.value)),
  INVERSIÓN: documentTypes.filter(type => ["invoice", "factura", "factura_compra"].includes(type.value)),
};

function requiredFiles(type: string) {
  if (type === "honorarios") return ["Boleta de honorarios", "Comprobante de pago o cartola", "Informe de boletas recibidas SII", "F29 del mes de la boleta"];
  if (type === "sueldo") return ["Liquidación de sueldo", "Comprobante de pago o cartola", "Certificado de pago de cotizaciones"];
  if (type === "invoice") return ["Documento tributario", "Comprobante de pago o cartola", "Invoice"];
  if (type === "factura_compra") return ["Invoice"];
  return ["Cargar documento tributario", "Cargar comprobante de pago o cartola"];
}

function needsOptionalDocument(type: string) {
  return type === "boleta";
}

export function ExpenseForm({ projectId, items, initialCategory = "", initialItem = "" }: Props) {
  const initial = rules[initialCategory] ? initialCategory : "";
  const [category, setCategory] = useState(initial);
  const [itemId, setItemId] = useState(items.some(item => item.id === initialItem && item.category === initial) ? initialItem : "");
  const [documentType, setDocumentType] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const categoryItems = useMemo(() => items.filter(item => item.category === category), [items, category]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    if (!form.checkValidity()) return form.reportValidity();
    setPending(true);
    try { await createClientExpense(new FormData(form)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible guardar el gasto. Inténtalo nuevamente."); setPending(false); }
  }

  const documents = requiredFiles(documentType);
  return <form className="form-card client-expense-form client-reference-form" onSubmit={submit}>
    <input type="hidden" name="project_id" value={projectId} />
    <div className="item-form-heading"><p className="eyebrow">AGREGAR GASTO</p><h1>Indique tipo de documento</h1><p>Selecciona la categoría y el ítem al que corresponde el gasto.</p></div>
    <div className="form-grid">
      <div className="field"><label>Categoría</label><select required value={category} onChange={event => { setCategory(event.target.value); setItemId(""); setDocumentType(""); }}><option value="">Seleccionar categoría</option>{Object.keys(rules).map(name => <option key={name} value={name}>{name}</option>)}</select></div>
      <div className="field"><label>Ítem de la categoría</label><select required name="item_id" value={itemId} disabled={!category} onChange={event => { setItemId(event.target.value); setDocumentType(""); }}><option value="">Seleccionar ítem</option>{categoryItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="field wide client-document-type"><label>Indique tipo de documento</label><select required name="document_type" value={documentType} disabled={!itemId} onChange={event => setDocumentType(event.target.value)}><option value="">Seleccionar</option>{(rules[category] ?? []).map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
    </div>
    {documentType && <>
      <div className="client-form-divider"><span>Paso 2 de 3</span><strong>Datos del gasto</strong></div>
      <div className="form-grid client-amount-row"><div className="field"><label>Monto a rendir</label><input name="amount" type="number" min="1" max="999999999999" step="1" required placeholder="0" /></div><div className="field"><label>Fecha de pago</label><input name="expense_date" type="date" required /></div></div>
      {documentType === "invoice" && <div className="invoice-fields"><div className="field"><label>Elegir tipo de invoice</label><select name="invoice_type" required defaultValue=""><option value="">Seleccionar</option>{["AWS", "Notion", "Google Cloud", "Google Workspace", "Claude", "Meta", "WhatsApp", "OpenAI", "Otro"].map(option => <option key={option}>{option}</option>)}</select></div></div>}
      <div className="client-form-divider"><span>Paso 3 de 3</span><strong>Documentos obligatorios</strong></div>
      <div className="client-files">{documents.map((label, index) => <div className="field" key={label}><label>{label}</label><input name={`file_${index}`} type="file" required accept="application/pdf,image/jpeg,image/png" /></div>)}{needsOptionalDocument(documentType) && <div className="field"><input type="hidden" name="optional_label" value="Cargar otro tipo de documento" /><label>Cargar otro tipo de documento <small>(opcional)</small></label><input name="file_optional" type="file" accept="application/pdf,image/jpeg,image/png" /></div>}{documentType === "invoice" && <div className="field"><input type="hidden" name="optional_label" value="Cargar SWIFT (si aplica pago directo por banco)" /><label>Cargar SWIFT <small>(si aplica pago directo por banco)</small></label><input name="file_optional" type="file" accept="application/pdf,image/jpeg,image/png" /></div>}</div>
      <p className="hint">Adjunta archivos PDF, JPG o PNG de hasta 5 MB cada uno.</p>
    </>}
    {error && <div className="validation show" role="alert">{error}</div>}
    <div className="actions"><Link className="back" href={`/cliente/proyectos/${projectId}`}>Cancelar</Link><button className="btn" disabled={!documentType || pending}>{pending ? "Guardando..." : "Guardar gasto"}</button></div>
  </form>;
}
