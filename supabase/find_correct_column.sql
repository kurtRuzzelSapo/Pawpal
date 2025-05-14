-- First, let's look at the structure of the post table to find the actual column names
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'post';

-- Then look at sample data to understand the structure
SELECT * FROM post LIMIT 5;

-- Also check the user_conversations table structure
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_conversations';

-- Look at sample user_conversations data
SELECT * FROM user_conversations LIMIT 5; 