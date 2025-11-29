-- Fix for role preservation issue
-- Run this SQL in your Supabase SQL Editor
-- This ensures admin and vet roles are not overwritten when users sign in/out

BEGIN;

-- Update the trigger function to preserve existing admin/vet roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert into public.users with all required fields
  INSERT INTO public.users (
    user_id,
    full_name,
    email,
    role,
    adoption_validation,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'User'
    ),
    COALESCE(NEW.email, ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'vet' THEN 'vet'
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
      ELSE 'user'
    END,
    CASE 
      WHEN (NEW.raw_user_meta_data ? 'adoption_validation') 
      THEN (NEW.raw_user_meta_data->'adoption_validation')::jsonb 
      ELSE NULL 
    END,
    timezone('utc', now())
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.users.full_name,
      NEW.email,
      'User'
    ),
    email = COALESCE(EXCLUDED.email, public.users.email, NEW.email, ''),
    -- CRITICAL: Preserve existing admin/vet roles - never overwrite them
    -- Only update role if the existing role is NULL or 'user'
    role = CASE 
      WHEN public.users.role IN ('admin', 'vet') THEN public.users.role
      ELSE COALESCE(EXCLUDED.role, public.users.role, 'user')
    END,
    adoption_validation = COALESCE(
      EXCLUDED.adoption_validation,
      public.users.adoption_validation
    );

  -- Upsert into public.profiles if the table exists
  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        'User'
      ),
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
      timezone('utc', now()),
      timezone('utc', now())
    )
    ON CONFLICT (id) DO UPDATE
    SET
      full_name = COALESCE(
        EXCLUDED.full_name,
        public.profiles.full_name
      ),
      avatar_url = COALESCE(
        EXCLUDED.avatar_url,
        public.profiles.avatar_url
      ),
      updated_at = timezone('utc', now());
  EXCEPTION
    WHEN undefined_table THEN
      -- Profiles table doesn't exist, skip it
      NULL;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Verify the function was updated
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

