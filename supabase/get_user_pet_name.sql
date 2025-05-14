-- Create function to get pet name for chat display
CREATE OR REPLACE FUNCTION public.get_user_pet_name(user_uuid UUID)
RETURNS TABLE (
  email TEXT,
  pet_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Get the auth.users email
  -- Get the most recent pet name from post table
  RETURN QUERY
  WITH user_email AS (
    SELECT email
    FROM auth.users
    WHERE id = user_uuid
  ),
  pet_info AS (
    -- Looking at your table screenshot, try different field names that might store user ID
    -- The field might be named differently than what we've been assuming
    SELECT name
    FROM post
    WHERE user_id = user_uuid  -- This is our best guess for the column name based on your schema
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT 
    (SELECT email FROM user_email),
    (SELECT name FROM pet_info);
END;
$$ LANGUAGE plpgsql; 