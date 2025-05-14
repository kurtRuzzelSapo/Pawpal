-- Create a function to get user pet information for chat display
CREATE OR REPLACE FUNCTION public.get_user_pet_info(user_id UUID)
RETURNS TABLE (
  email TEXT,
  pet_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_email AS (
    SELECT au.email
    FROM auth.users au
    WHERE au.id = user_id
  ),
  user_pet AS (
    -- Get the most recent pet from post table where user_id matches
    -- Note: The column might be called "user_id" based on your schema
    SELECT p.name AS pet_name
    FROM post p
    WHERE p.user_id = user_id
    ORDER BY p.created_at DESC
    LIMIT 1
  )
  SELECT 
    (SELECT email FROM user_email),
    (SELECT pet_name FROM user_pet);
END;
$$ LANGUAGE plpgsql; 