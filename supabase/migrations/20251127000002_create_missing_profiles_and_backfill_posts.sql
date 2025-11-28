-- Migration: Create missing profiles from auth.users and backfill posts.owner_name
-- Created: 2025-11-27
-- Purpose: Ensure every auth user has a `profiles` row (id, full_name, avatar_url)
--          and populate posts.owner_name from profiles.full_name when missing.
-- Run this in the Supabase SQL editor as a project owner / service role.

BEGIN;

-- 1) Create missing profiles for auth.users entries that lack a profiles row.
-- Use COALESCE on raw_user_meta_data->>'full_name' and email as fallback.
INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS full_name,
       NULLIF(u.raw_user_meta_data->>'avatar_url', '') AS avatar_url,
       timezone('utc', now()),
       timezone('utc', now())
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2) Backfill posts.owner_name from profiles.full_name when owner_name is NULL
UPDATE public.posts p
SET owner_name = pr.full_name
FROM public.profiles pr
WHERE p.owner_name IS NULL
  AND pr.id = p.user_id
  AND pr.full_name IS NOT NULL;

-- 3) As a safety step, also try to backfill from auth.users raw metadata if profiles are missing
UPDATE public.posts p
SET owner_name = COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE p.owner_name IS NULL
  AND u.id = p.user_id
  AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.email IS NOT NULL);

COMMIT;

-- Notes:
-- - Run this in Supabase SQL editor (it requires owner privileges to read auth.users and write public.profiles).
-- - This migration is idempotent: repeated runs will not duplicate rows because of the LEFT JOIN filter.
-- - After running, refresh your admin UI and public pages; `posts.owner_name` will be used by the app.
