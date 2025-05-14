-- Simple direct lookup for pet name based on user's email
CREATE OR REPLACE FUNCTION public.get_pet_by_email(user_email TEXT)
RETURNS TEXT
SECURITY DEFINER
AS $$
DECLARE
  pet_name TEXT;
BEGIN
  -- Just get the most recent pet name directly from post table
  SELECT p.name INTO pet_name
  FROM post p
  INNER JOIN auth.users au ON p.auth_users_id = au.id OR p.user_id = au.id
  WHERE au.email = user_email
  ORDER BY p.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(pet_name, 'Pet');
END;
$$ LANGUAGE plpgsql;

-- Function to get pet name and set the conversation title
CREATE OR REPLACE FUNCTION public.get_conversation_title(conv_id UUID)
RETURNS TEXT
SECURITY DEFINER
AS $$
DECLARE
  pet_name TEXT;
  participant_email TEXT;
BEGIN
  -- Get participant email from user_conversations and auth.users
  SELECT au.email INTO participant_email
  FROM user_conversations uc
  JOIN auth.users au ON uc.user_id = au.id
  WHERE uc.conversation_id = conv_id
  LIMIT 1;
  
  IF participant_email IS NULL THEN
    RETURN 'Chat';
  END IF;
  
  -- Get pet name using the email
  pet_name := get_pet_by_email(participant_email);
  
  RETURN pet_name;
END;
$$ LANGUAGE plpgsql; 