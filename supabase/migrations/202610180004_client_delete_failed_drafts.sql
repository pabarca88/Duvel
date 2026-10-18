-- Permite limpiar un borrador propio si falla la carga o el envío de la rendición.
-- No permite borrar rendiciones enviadas ni de otros usuarios.
drop policy if exists "client delete own failed drafts" on public.expenses;

create policy "client delete own failed drafts" on public.expenses
  for delete
  using (
    submitted_by = auth.uid()
    and status = 'draft'
  );
