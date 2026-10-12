-- Los usuarios necesitan leer su propio perfil después de iniciar sesión; los
-- administradores requieren además consultar perfiles para gestionar proyectos.
create policy "read own profile or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "admin manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
