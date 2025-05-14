-- Create a function to safely get user email by ID
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