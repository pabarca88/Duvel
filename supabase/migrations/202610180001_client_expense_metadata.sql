alter table public.expenses
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.expense_documents
  add column if not exists label text;
