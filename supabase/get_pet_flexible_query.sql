-- Create a function to get pet name that tries multiple possible user ID field names
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

-- Create a wrapper function that returns both email and pet name
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