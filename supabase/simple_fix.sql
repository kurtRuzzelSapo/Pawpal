-- CORRECTED SIMPLE SOLUTION: Just set all conversation titles to the pet names from post table
-- This is a direct update of conversation titles with no complex logic

-- First, let's look at the structure of the post table to see the correct column names
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'post'
ORDER BY ordinal_position;

-- Step 1: Update all existing conversations with pet names from post table
-- Using only user_id since that appears to be the correct field
UPDATE conversations c
SET title = (
  SELECT p.name  -- This gets the pet name directly from post table
  FROM user_conversations uc
  JOIN post p ON p.user_id = uc.user_id  -- Use user_id field
  WHERE uc.conversation_id = c.id
  LIMIT 1
);

-- Step 3: Show the updated titles to confirm it worked
SELECT id, title, created_at, updated_at
FROM conversations; 