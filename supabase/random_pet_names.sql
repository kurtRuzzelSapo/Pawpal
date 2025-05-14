-- RANDOM PET NAMES: Assign pet names randomly

-- First, let's see what pet names we have in the post table
SELECT DISTINCT name FROM post WHERE name IS NOT NULL;

-- Update conversation titles with random pet names from post table
UPDATE conversations c
SET title = (
  SELECT name 
  FROM post 
  WHERE name IS NOT NULL
  ORDER BY RANDOM() 
  LIMIT 1
);

-- Show results
SELECT id, title, created_at, updated_at FROM conversations; 