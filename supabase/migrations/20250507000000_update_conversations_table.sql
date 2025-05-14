-- Add columns to store additional information about the chat participants and pet
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS adopter_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS post_id BIGINT REFERENCES post(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pet_name TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_post_id ON conversations(post_id);

-- Update titles of existing conversations based on pet name if possible
UPDATE conversations c
SET 
  pet_name = (
    SELECT p.name
    FROM user_conversations uc
    JOIN post p ON (p.user_id = uc.user_id OR p.auth_users_id = uc.user_id)
    WHERE uc.conversation_id = c.id
    ORDER BY p.created_at DESC
    LIMIT 1
  ),
  title = (
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

-- Create a function to get user display name (fallback to email if no profile)
CREATE OR REPLACE FUNCTION get_user_display_name(user_uuid UUID)
RETURNS TEXT
SECURITY DEFINER
AS $$
DECLARE
  display_name TEXT;
BEGIN
  -- Try to get the name from profiles first
  SELECT full_name INTO display_name
  FROM profiles
  WHERE id = user_uuid;
  
  -- If no profile name, fallback to email
  IF display_name IS NULL THEN
    SELECT email INTO display_name
    FROM auth.users
    WHERE id = user_uuid;
  END IF;
  
  RETURN display_name;
END;
$$ LANGUAGE plpgsql; 