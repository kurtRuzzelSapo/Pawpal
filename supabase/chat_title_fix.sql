-- Fix conversation titles for all conversations directly
-- This replaces email-based titles with pet names

-- Step 1: Directly update conversation titles with pet names
UPDATE conversations c
SET title = (
  SELECT p.name
  FROM user_conversations uc
  JOIN post p ON p.user_id = uc.user_id
  WHERE uc.conversation_id = c.id
  ORDER BY p.created_at DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM user_conversations uc
  JOIN post p ON p.user_id = uc.user_id
  WHERE uc.conversation_id = c.id
);

-- Step 2: If the above missed some, try auth_users_id
UPDATE conversations c
SET title = (
  SELECT p.name
  FROM user_conversations uc
  JOIN post p ON p.auth_users_id = uc.user_id
  WHERE uc.conversation_id = c.id
  ORDER BY p.created_at DESC
  LIMIT 1
)
WHERE title IS NULL OR title LIKE 'Chat with%' OR title LIKE 'Direct Message%';

-- Step 3: Add a trigger to keep this updated automatically
CREATE OR REPLACE FUNCTION update_conversation_title()
RETURNS TRIGGER AS $$
DECLARE
  pet_name TEXT;
BEGIN
  -- Try to find a pet name for this user
  SELECT p.name INTO pet_name
  FROM post p
  WHERE p.user_id = NEW.user_id OR p.auth_users_id = NEW.user_id
  ORDER BY p.created_at DESC
  LIMIT 1;
  
  -- Update the conversation title if we found a pet name
  IF pet_name IS NOT NULL THEN
    UPDATE conversations
    SET title = pet_name
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS user_conversation_pet_title_trigger ON user_conversations;
CREATE TRIGGER user_conversation_pet_title_trigger
AFTER INSERT ON user_conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_title();

-- Check all updated conversation titles
SELECT id, title, created_at, updated_at
FROM conversations
ORDER BY updated_at DESC; 