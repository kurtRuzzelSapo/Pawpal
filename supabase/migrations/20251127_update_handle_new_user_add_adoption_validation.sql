-- Migration: Update handle_new_user to include adoption_validation
-- Created: 2025-11-27
-- Purpose: Ensure the auth trigger inserts adoption_validation JSONB from auth.users.raw_user_meta_data

BEGIN;

-- Replace the existing trigger function to also save adoption_validation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        user_id,
        full_name,
        email,
        role,
        adoption_validation
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        CASE
            WHEN NEW.raw_user_meta_data->>'role' = 'vet' THEN 'vet'
            WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
            ELSE 'user'
        END,
        -- Try to extract adoption_validation as JSONB; if missing, insert NULL
        CASE
            WHEN (NEW.raw_user_meta_data ? 'adoption_validation') THEN (NEW.raw_user_meta_data->'adoption_validation')::jsonb
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Note: After applying this migration, newly created auth.users rows will have their
-- `raw_user_meta_data.adoption_validation` saved into `public.users.adoption_validation`.
-- This does not backfill existing rows; run the backfill migration if you need to populate
-- adoption_validation for previously created users.
