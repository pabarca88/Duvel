-- El cliente necesita listar sus propias asignaciones para poder elegir un proyecto.
drop policy if exists "members read own membership" on public.project_members;
create policy "members read own membership" on public.project_members
  for select using (user_id = auth.uid() or public.is_admin());
