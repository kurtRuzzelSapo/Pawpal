-- Directly update all conversation titles with pet names
-- First, create a temporary function to debug the data
DROP FUNCTION IF EXISTS debug_pet_data();
CREATE OR REPLACE FUNCTION debug_pet_data()
RETURNS TABLE (
  conversation_id UUID,
  user_id UUID,
  user_email TEXT,
  pet_name TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.conversation_id,
    uc.user_id,
    au.email,
    p.name AS pet_name
  FROM user_conversations uc
  JOIN auth.users au ON uc.user_id = au.id
  LEFT JOIN post p ON (p.user_id = au.id OR p.auth_users_id = au.id)
  WHERE p.name IS NOT NULL
  ORDER BY uc.conversation_id, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Show debug data
SELECT * FROM debug_pet_data();

-- Now update the conversation titles directly
UPDATE conversations c
SET title = (
  SELECT p.name
  FROM user_conversations uc
  JOIN post p ON (p.user_id = uc.user_id OR p.auth_users_id = uc.user_id)
  WHERE uc.conversation_id = c.id
  ORDER BY p.created_at DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM user_conversations uc
  JOIN post p ON (p.user_id = uc.user_id OR p.auth_users_id = uc.user_id)
  WHERE uc.conversation_id = c.id
);

-- List the updated conversation titles
SELECT id, title, created_at, updated_at
FROM conversations
ORDER BY updated_at DESC; 