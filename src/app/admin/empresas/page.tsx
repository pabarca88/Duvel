import Link from "next/link";
import { createCompany } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase.from("companies").select("id, name, tax_id").eq("active", true).order("name");
  return <><div className="titlebar">MIS EMPRESAS</div><main className="page"><div className="container grid-2"><div><div className="eyebrow">Selecciona una empresa</div><div className="select-list">{companies?.map(company => <Link key={company.id} href={`/admin/proyectos?empresa=${company.id}`} className="select-card">{company.name}{company.tax_id ? ` · ${company.tax_id}` : ""}</Link>)}{!companies?.length && <p className="empty">Aún no hay empresas. Crea la primera para comenzar.</p>}</div><details className="admin-details"><summary>+ Agregar empresa</summary><form action={createCompany} className="form-card admin-form"><div className="field"><label>Razón social</label><input name="name" required placeholder="Empresa SpA" /></div><div className="field"><label>RUT</label><input name="tax_id" placeholder="76.123.456-7" /></div><button className="btn">Guardar empresa</button></form></details></div><img className="illus" src="/assets/images/empresas.jpg" alt="Selección de empresa" /></div></main></>;
}
