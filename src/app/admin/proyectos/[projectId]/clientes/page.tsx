import Link from "next/link";
import { notFound } from "next/navigation";
import { assignClientToProject, removeClientFromProject } from "../../../actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectClientsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: clients }, { data: members }] = await Promise.all([
    supabase.from("projects").select("id, name, code, companies(name)").eq("id", projectId).eq("active", true).maybeSingle(),
    supabase.from("profiles").select("id, full_name").eq("role", "client").order("full_name"),
    supabase.from("project_members").select("user_id, profiles(full_name, role)").eq("project_id", projectId),
  ]);
  if (!project) notFound();
  const assignedIds = new Set(members?.map(member => member.user_id));
  const assigned = members?.flatMap(member => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    return profile?.role === "client" ? [{ id: member.user_id, fullName: profile.full_name }] : [];
  }) ?? [];
  const availableClients = clients?.filter(client => !assignedIds.has(client.id)) ?? [];
  return <><div className="titlebar">ASIGNAR CLIENTES</div><main className="page"><div className="container client-assignment-page"><div className="project-context"><Link className="back" href="/admin/proyectos">Proyectos</Link><span><strong>{project.name}</strong> · {project.code}</span></div><section className="form-card assignment-card"><h1>Clientes del proyecto</h1><p>Asigna clientes creados previamente para que puedan ver este proyecto y registrar rendiciones.</p><form action={assignClientToProject.bind(null, project.id)} className="assignment-form"><select name="client_id" required defaultValue=""><option value="">Seleccionar cliente</option>{availableClients.map(client => <option key={client.id} value={client.id}>{client.full_name}</option>)}</select><button className="btn" disabled={!availableClients.length}>Asignar cliente</button></form>{!availableClients.length && <p className="admin-project-meta">No hay otros clientes disponibles para asignar.</p>}<div className="assigned-clients"><h2>Clientes con acceso</h2>{assigned.map(client => <div key={client.id}><strong>{client.fullName}</strong><ConfirmSubmit action={removeClientFromProject.bind(null, project.id, client.id)} message={`¿Quitar el acceso de ${client.fullName} a este proyecto?`} className="btn btn-danger btn-sm">Quitar acceso</ConfirmSubmit></div>)}{!assigned.length && <p className="empty">Este proyecto aún no tiene clientes asignados.</p>}</div></section></div></main></>;
}
