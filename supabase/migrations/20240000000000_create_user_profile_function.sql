-- Create a function to safely create a user profile
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_role TEXT,
  p_bio TEXT,
  p_location TEXT,
  p_is_shelter BOOLEAN,
  p_verified BOOLEAN
) RETURNS void AS $$
BEGIN
  -- Wait for a short time to ensure auth.users entry exists
  PERFORM pg_sleep(0.5);
  
  -- Verify the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insert the profile
  INSERT INTO users (
    user_id,
    role,
    bio,
    location,
    is_shelter,
    verified,
    favorites,
    adoption_history
  ) VALUES (
    p_user_id,
    p_role,
    p_bio,
    p_location,
    p_is_shelter,
    p_verified,
    ARRAY[]::jsonb[],
    ARRAY[]::jsonb[]
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 