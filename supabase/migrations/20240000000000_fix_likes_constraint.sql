-- Drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS public.likes
DROP CONSTRAINT IF EXISTS likes_post_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.likes
ADD CONSTRAINT likes_post_id_fkey
FOREIGN KEY (post_id)
REFERENCES public.post(id)
ON DELETE CASCADE; 