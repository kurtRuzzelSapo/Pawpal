-- Get all the posts from the post table
CREATE OR REPLACE FUNCTION public.get_all_pet_names()
RETURNS TABLE (
  pet_name TEXT,
  image_url TEXT,
  user_email TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name, 
    p.image_url,
    au.email
  FROM post p
  LEFT JOIN auth.users au ON p.user_id = au.id OR p.auth_users_id = au.id;
END;
$$ LANGUAGE plpgsql;

-- Directly update conversation titles based on pet names
CREATE OR REPLACE FUNCTION public.rename_conversations_to_pet_names()
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  conv_rec RECORD;
  user_rec RECORD;
  pet_name TEXT;
BEGIN
  -- Loop through all conversations
  FOR conv_rec IN SELECT id FROM conversations
  LOOP
    -- For each conversation, get one participant
    SELECT user_id INTO user_rec
    FROM user_conversations
    WHERE conversation_id = conv_rec.id
    LIMIT 1;
    
    IF user_rec IS NOT NULL THEN
      -- Try to find a pet associated with this user
      SELECT p.name INTO pet_name
      FROM post p
      WHERE p.user_id = user_rec.user_id OR p.auth_users_id = user_rec.user_id
      ORDER BY p.created_at DESC
      LIMIT 1;
      
      -- If we found a pet name, update the conversation title
      IF pet_name IS NOT NULL THEN
        UPDATE conversations
        SET title = pet_name
        WHERE id = conv_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql; 