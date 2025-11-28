create or replace function public.increment_visit_count()
returns bigint
language plpgsql
as $$
declare
  new_count bigint;
begin
  update public.visit_counter
  set count = count + 1
  where id = true
  returning count into new_count;
  return new_count;
end;
$$;
