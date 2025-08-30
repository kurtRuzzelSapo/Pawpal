-- Ensure adoption_requests.adoption_reason exists and fix FK to reference posts(id)

DO $$
DECLARE
  fk_name text;
BEGIN
  -- Add adoption_reason column if missing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'adoption_requests'
  ) THEN
    EXECUTE 'ALTER TABLE public.adoption_requests ADD COLUMN IF NOT EXISTS adoption_reason TEXT';
  END IF;

  -- Fix foreign key to reference public.posts(id) instead of public.post(id)
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.constraint_schema = kcu.constraint_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.constraint_schema = tc.constraint_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'adoption_requests'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'post_id';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.adoption_requests DROP CONSTRAINT %I', fk_name);
  END IF;

  -- Recreate FK to posts(id) if posts table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'posts'
  ) THEN
    EXECUTE 'ALTER TABLE public.adoption_requests
             ADD CONSTRAINT adoption_requests_post_id_fkey
             FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE';
  END IF;

END $$;


