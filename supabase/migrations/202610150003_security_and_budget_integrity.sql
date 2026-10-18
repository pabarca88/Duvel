-- El desglose debe reconciliar siempre con el total del ítem.
alter table public.budget_items
  add constraint budget_items_account_total_check
  check (allocated_amount = subsidy_amount + company_amount);

alter table public.document_reviews
  add constraint document_reviews_comment_length_check
  check (comment is null or char_length(comment) <= 2000);

create or replace function public.touch_expense_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
for each row execute procedure public.touch_expense_updated_at();

-- Los clientes pueden leer solo el presupuesto de los proyectos a los que pertenecen.
create policy "members read budget categories" on public.budget_categories
  for select using (public.is_admin() or public.is_project_member(project_id));
create policy "members read budget items" on public.budget_items
  for select using (public.is_admin() or exists (
    select 1 from public.budget_categories c where c.id = category_id and public.is_project_member(c.project_id)
  ));
create policy "members read document requirements" on public.document_requirements
  for select using (public.is_admin() or exists (
    select 1 from public.budget_items i join public.budget_categories c on c.id = i.category_id
    where i.id = budget_item_id and public.is_project_member(c.project_id)
  ));
