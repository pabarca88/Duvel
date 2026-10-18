import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión no válida");
  const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).single();
  if (!profile || !["admin", "superadmin"].includes(profile.role)) throw new Error("No tienes permisos de administrador");
  return { supabase, user, profile };
});
