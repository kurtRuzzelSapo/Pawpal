-- Create a secure function to handle user signup
CREATE OR REPLACE FUNCTION handle_new_user_profile(
  user_id UUID,
  user_role TEXT,
  user_bio TEXT,
  user_location TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    user_id,
    role,
    bio,
    location,
    is_shelter,
    verified,
    favorites,
    adoption_history
  ) VALUES (
    user_id,
    user_role,
    user_bio,
    user_location,
    false,
    false,
    '[]'::jsonb,
    '[]'::jsonb
  );
END;
$$; 