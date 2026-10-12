import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (["admin", "superadmin"].includes(profile.role)) redirect("/admin");
  return <main className="min-h-screen bg-[#f5f6f3] p-8 sm:p-12"><p className="text-sm font-semibold tracking-[0.2em] text-[#b46c42]">DUVEL CONSULTING</p><h1 className="mt-5 text-4xl font-semibold">Hola, {profile.full_name}</h1><p className="mt-3 max-w-xl text-[#52615f]">Tu acceso de cliente está activo. Próximamente podrás seleccionar el proyecto y registrar tus rendiciones desde aquí.</p></main>;
}
