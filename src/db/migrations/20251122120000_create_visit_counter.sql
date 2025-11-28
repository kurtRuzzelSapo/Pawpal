create table if not exists public.visit_counter (
  id boolean primary key default true, -- only one row for the counter
  count bigint not null default 0
);

insert into public.visit_counter(id, count)
values (true, 0)
on conflict (id) do nothing;
