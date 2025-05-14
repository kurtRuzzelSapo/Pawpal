-- VERY SIMPLE UPDATE: Get pet names directly from the post table
-- Based on visible column names from the screenshot

-- Our main goal is to update conversation titles with pet names
-- We'll just use the columns we can see in the screenshot

-- Update conversations with pet names
-- We'll try linking post to user_conversations via any ID matching
UPDATE conversations c
SET title = (
  SELECT p.name  -- Use the 'name' column from post
  FROM post p
  JOIN user_conversations uc ON uc.conversation_id = c.id
  LIMIT 1
);

-- Check the results
SELECT id, title, created_at, updated_at
FROM conversations; 