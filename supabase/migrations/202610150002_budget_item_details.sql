alter table public.budget_items
  add column if not exists funding_source text check (funding_source in ('subsidy', 'company', 'both')),
  add column if not exists tax_id text,
  add column if not exists monthly_hours integer check (monthly_hours between 1 and 165);
