-- Permite que un cliente entregue una rendición propia después de adjuntar los documentos.
-- La fila debe pertenecer al usuario y sólo puede venir desde draft u observed.
drop policy if exists "client update draft expenses" on public.expenses;

create policy "client submit own expenses" on public.expenses
  for update
  using (
    submitted_by = auth.uid()
    and status in ('draft', 'observed')
  )
  with check (
    submitted_by = auth.uid()
    and status in ('draft', 'observed', 'submitted')
  );
