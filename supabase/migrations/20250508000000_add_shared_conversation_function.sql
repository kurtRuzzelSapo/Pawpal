-- Function to find shared conversations between two users for a specific post
CREATE OR REPLACE FUNCTION find_shared_conversation(
  user_id_1 UUID, 
  user_id_2 UUID,
  specific_post_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  conversation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If specific_post_id is provided, ONLY look for conversations about that specific post
  -- This ensures that different posts get different conversations
  IF specific_post_id IS NOT NULL THEN
    RETURN QUERY
    SELECT DISTINCT uc1.conversation_id
    FROM user_conversations uc1
    JOIN user_conversations uc2 ON uc1.conversation_id = uc2.conversation_id
    JOIN conversations c ON c.id = uc1.conversation_id
    WHERE uc1.user_id = user_id_1
      AND uc2.user_id = user_id_2
      AND c.post_id = specific_post_id
    LIMIT 1;
    
    -- Exit the function, returning only if we found a match for this specific post
    RETURN;
  END IF;
  
  -- If no specific_post_id is provided, find any conversation between these users
  -- This only runs when we're not looking for a specific post
  RETURN QUERY
  SELECT DISTINCT uc1.conversation_id
  FROM user_conversations uc1
  JOIN user_conversations uc2 ON uc1.conversation_id = uc2.conversation_id
  WHERE uc1.user_id = user_id_1
    AND uc2.user_id = user_id_2
  LIMIT 1;
  
  RETURN;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_conversations_user_conversation ON user_conversations(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_post_id ON conversations(post_id); 