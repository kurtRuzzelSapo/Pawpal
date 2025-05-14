-- SIMPLE SOLUTION: Just set all conversation titles to the pet names from post table
-- This is a direct update of conversation titles with no complex logic

-- Step 1: Update all existing conversations with pet names from post table
UPDATE conversations c
SET title = (
  SELECT p.name  -- This gets the pet name directly from post table
  FROM user_conversations uc
  JOIN post p ON p.user_id = uc.user_id  -- Try the user_id field first
  WHERE uc.conversation_id = c.id
  LIMIT 1
);

-- Step 2: If some rows didn't get updated, try the auth_users_id field
UPDATE conversations c
SET title = (
  SELECT p.name  -- This gets the pet name directly from post table
  FROM user_conversations uc 
  JOIN post p ON p.auth_users_id = uc.user_id  -- Try auth_users_id field
  WHERE uc.conversation_id = c.id
  LIMIT 1
)
WHERE title IS NULL OR title = '';

-- Step 3: Show the updated titles to confirm it worked
SELECT id, title, created_at, updated_at
FROM conversations; 