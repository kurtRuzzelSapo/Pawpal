-- Migration: Add owner_name column to posts if missing and backfill
-- Created: 2025-11-27
-- Purpose: Ensure `owner_name` column exists on posts and populate it from users.full_name
-- Run this as a project owner (Supabase SQL editor) or with your migrations tool.

BEGIN;

-- Add the column if it doesn't exist
ALTER TABLE IF EXISTS public.posts
ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Backfill owner_name for posts where it's NULL using users.full_name
UPDATE public.posts p
SET owner_name = u.full_name
FROM public.users u
WHERE p.owner_name IS NULL
  AND u.user_id = p.user_id
  AND u.full_name IS NOT NULL;

COMMIT;

-- Verification query examples (run after executing migration):
-- SELECT p.id, p.user_id, p.owner_name, u.full_name
-- FROM public.posts p
-- LEFT JOIN public.users u ON u.user_id = p.user_id
-- WHERE p.owner_name IS NULL;

-- Notes:
-- - If your `users` table uses a different key (e.g., `id`), change `u.user_id = p.user_id` to match.
-- - Running this requires proper privileges; use the Supabase SQL editor or a service role key.
