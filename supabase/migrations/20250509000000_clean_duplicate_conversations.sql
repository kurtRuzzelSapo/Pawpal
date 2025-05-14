-- Function to identify and clean up duplicate conversations between the same users
CREATE OR REPLACE FUNCTION admin_clean_duplicate_conversations()
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  conversation_pair RECORD;
  keep_conversation_id UUID;
  duplicate_conversation_id UUID;
  messages_moved INT := 0;
  conversations_deleted INT := 0;
  result_message TEXT;
BEGIN
  -- Find pairs of conversations between the same users
  FOR conversation_pair IN (
    WITH conversation_users AS (
      -- Get all conversation-user pairs
      SELECT 
        c.id as conversation_id,
        uc.user_id,
        c.post_id,
        c.created_at,
        c.updated_at,
        c.pet_name
      FROM conversations c
      JOIN user_conversations uc ON c.id = uc.conversation_id
    ),
    conversation_user_count AS (
      -- Count users per conversation
      SELECT 
        conversation_id, 
        COUNT(user_id) as user_count,
        array_agg(user_id ORDER BY user_id) as user_array
      FROM conversation_users
      GROUP BY conversation_id
    ),
    potential_duplicates AS (
      -- Find conversations with the same users (for 2-user conversations)
      SELECT 
        a.conversation_id as conv_id_1,
        b.conversation_id as conv_id_2,
        a.user_array
      FROM conversation_user_count a
      JOIN conversation_user_count b ON 
        a.user_array = b.user_array AND
        a.conversation_id < b.conversation_id AND -- This ensures we don't have reverse pairs
        a.user_count = b.user_count AND
        a.user_count = 2 -- Focus on 2-user conversations which are most common
    )
    SELECT 
      pd.conv_id_1,
      pd.conv_id_2,
      cu1.post_id as post_id_1,
      cu2.post_id as post_id_2,
      cu1.created_at as created_at_1,
      cu2.created_at as created_at_2,
      cu1.pet_name as pet_name_1,
      cu2.pet_name as pet_name_2
    FROM potential_duplicates pd
    -- Get additional info about first conversation
    JOIN (
      SELECT DISTINCT ON (conversation_id) 
        conversation_id, post_id, created_at, updated_at, pet_name
      FROM conversation_users
    ) cu1 ON pd.conv_id_1 = cu1.conversation_id
    -- Get additional info about second conversation
    JOIN (
      SELECT DISTINCT ON (conversation_id) 
        conversation_id, post_id, created_at, updated_at, pet_name
      FROM conversation_users
    ) cu2 ON pd.conv_id_2 = cu2.conversation_id
    ORDER BY cu1.created_at
  ) LOOP
    -- Decide which conversation to keep
    -- Prefer conversations with pet_name and post_id set
    IF conversation_pair.pet_name_1 IS NOT NULL AND conversation_pair.post_id_1 IS NOT NULL THEN
      keep_conversation_id := conversation_pair.conv_id_1;
      duplicate_conversation_id := conversation_pair.conv_id_2;
    ELSIF conversation_pair.pet_name_2 IS NOT NULL AND conversation_pair.post_id_2 IS NOT NULL THEN
      keep_conversation_id := conversation_pair.conv_id_2;
      duplicate_conversation_id := conversation_pair.conv_id_1;
    ELSE
      -- If neither has pet info or both do, keep the older one
      IF conversation_pair.created_at_1 <= conversation_pair.created_at_2 THEN
        keep_conversation_id := conversation_pair.conv_id_1;
        duplicate_conversation_id := conversation_pair.conv_id_2;
      ELSE
        keep_conversation_id := conversation_pair.conv_id_2;
        duplicate_conversation_id := conversation_pair.conv_id_1;
      END IF;
    END IF;

    -- Move messages from duplicate to keeper
    UPDATE messages
    SET conversation_id = keep_conversation_id
    WHERE conversation_id = duplicate_conversation_id
    AND NOT EXISTS (
      -- Avoid duplicating the exact same message content
      SELECT 1 FROM messages m2
      WHERE m2.conversation_id = keep_conversation_id
      AND m2.content = messages.content
      AND m2.sender_id = messages.sender_id
      AND ABS(EXTRACT(EPOCH FROM (m2.created_at - messages.created_at))) < 10 -- Within 10 seconds
    );
    
    GET DIAGNOSTICS messages_moved = ROW_COUNT;
    
    -- Update the updated_at timestamp of the keeper
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = keep_conversation_id;
    
    -- Delete the duplicate conversation's user connections
    DELETE FROM user_conversations
    WHERE conversation_id = duplicate_conversation_id;
    
    -- Delete the duplicate conversation
    DELETE FROM conversations
    WHERE id = duplicate_conversation_id;
    
    GET DIAGNOSTICS conversations_deleted = ROW_COUNT;
    
    -- Log the action
    RAISE NOTICE 'Merged conversation % into %. Moved % messages. Deleted % conversation record.',
      duplicate_conversation_id, keep_conversation_id, messages_moved, conversations_deleted;
  END LOOP;
  
  result_message := 'Duplicate conversation cleanup complete. Check the logs for details.';
  RETURN result_message;
END;
$$;

-- Grant execution permission to the service_role only
GRANT EXECUTE ON FUNCTION admin_clean_duplicate_conversations() TO service_role;

-- Create admin trigger function to run this cleanup periodically
CREATE OR REPLACE FUNCTION daily_cleanup_trigger()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Only run this once per day to avoid overhead
  IF (SELECT COUNT(*) FROM admin_cleanup_log WHERE created_at > CURRENT_DATE) = 0 THEN
    -- Log this run
    INSERT INTO admin_cleanup_log (action, result)
    VALUES ('duplicate_conversation_cleanup', admin_clean_duplicate_conversations());
  END IF;
  RETURN NEW;
END;
$$;

-- Create a log table to track cleanups
CREATE TABLE IF NOT EXISTS admin_cleanup_log (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT,
  result TEXT
);

-- Enable the trigger for automatic daily cleanup
CREATE TRIGGER conversations_cleanup_trigger
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION daily_cleanup_trigger();

-- Run an initial cleanup to fix any existing duplicates
SELECT admin_clean_duplicate_conversations(); 