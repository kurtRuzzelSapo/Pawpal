-- Combined SQL script for pet chat functionality

-- Basic email function (fallback)
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TABLE (email TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.email
  FROM auth.users au
  WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Flexible pet name retrieval that tries multiple possible ID field names
CREATE OR REPLACE FUNCTION public.get_pet_name_flexible(user_uuid UUID)
RETURNS TEXT
SECURITY DEFINER
AS $$
DECLARE
  pet_name TEXT;
BEGIN
  -- First try user_id
  SELECT name INTO pet_name
  FROM post
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If that didn't work, try auth_users_id (from your schema screenshot)
  IF pet_name IS NULL THEN
    SELECT name INTO pet_name
    FROM post
    WHERE auth_users_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- If that didn't work, try just "id" in case the user is directly stored
  IF pet_name IS NULL THEN
    SELECT name INTO pet_name
    FROM post
    WHERE id::text = user_uuid::text
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN pet_name;
END;
$$ LANGUAGE plpgsql;

-- Main function to get both email and pet name
CREATE OR REPLACE FUNCTION public.get_user_with_pet(user_uuid UUID)
RETURNS TABLE (
  email TEXT,
  pet_name TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT email FROM auth.users WHERE id = user_uuid),
    get_pet_name_flexible(user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Run a test to check if it works
SELECT * FROM get_user_with_pet('d61810ef-fb3a-42aa-8977-88567f6c997d'); 