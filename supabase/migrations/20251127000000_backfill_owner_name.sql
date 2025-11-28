-- Migration: Backfill posts.owner_name from users.full_name
-- Created: 2025-11-27
-- Purpose: Populate owner_name column on posts for existing rows where it's NULL.
-- IMPORTANT: Run as a project owner (service role) or in Supabase SQL editor.

BEGIN;

-- Preview rows that will be updated (optional):
-- SELECT p.id, p.user_id, p.owner_name, u.full_name
-- FROM public.posts p
-- JOIN public.users u ON u.user_id = p.user_id
-- WHERE p.owner_name IS NULL AND u.full_name IS NOT NULL;

UPDATE public.posts p
SET owner_name = u.full_name
FROM public.users u
WHERE p.owner_name IS NULL
  AND u.user_id = p.user_id
  AND u.full_name IS NOT NULL;

COMMIT;

-- Notes:
-- - This assumes `users.user_id` is the column linking to `posts.user_id`.
-- - If your `users` table uses a different key (e.g., `id`), adjust the JOIN condition accordingly.
-- - After running, refresh the client; stored `owner_name` will be used by the app without requiring reads to `users`.
