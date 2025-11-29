-- Fix for user signup issue
-- Run this SQL in your Supabase SQL Editor
-- This will fix the RLS policy to allow user signup to work properly

BEGIN;

-- Step 1: Ensure all required columns exist in the users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS adoption_validation JSONB;

-- Step 2: Drop existing insert policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for registration" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users during signup" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

-- Step 3: Create a policy that allows inserts during signup
-- This allows:
-- 1. Authenticated users to insert their own profile (auth.uid() = user_id)
-- 2. Service role (trigger functions) to insert any user profile
-- 3. Unauthenticated inserts if the user_id matches a newly created auth user
CREATE POLICY "Enable insert for registration"
    ON public.users
    FOR INSERT
    WITH CHECK (
        -- Allow if user is authenticated and inserting their own profile
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        -- Allow service role (for trigger functions)
        (auth.role() = 'service_role')
        OR
        -- Allow if user_id exists in auth.users (for trigger-based inserts)
        (EXISTS (SELECT 1 FROM auth.users WHERE id = user_id))
    );

-- Step 4: Ensure the trigger function exists and is correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
    -- Preserve existing role - don't overwrite admin/vet roles with 'user'
    -- Only update role if the existing role is NULL or if it's a new insert
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

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- Verify the policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE tablename = 'users' 
  AND policyname = 'Enable insert for registration';

-- Verify the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

