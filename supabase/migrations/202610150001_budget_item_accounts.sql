alter table public.budget_items
  add column if not exists subsidy_amount numeric(14,2) not null default 0 check (subsidy_amount >= 0),
  add column if not exists company_amount numeric(14,2) not null default 0 check (company_amount >= 0);

update public.budget_items
set subsidy_amount = allocated_amount
where subsidy_amount = 0 and company_amount = 0;
