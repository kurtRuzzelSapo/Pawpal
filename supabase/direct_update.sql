-- DIRECT UPDATE: Set all conversations to pet names
-- This simply updates all conversations to use pet names

-- Update all conversations to show "Rabbit" instead of email
UPDATE conversations SET title = 'Rabbit';

-- You can also manually update specific conversations if needed
-- UPDATE conversations SET title = 'cat' WHERE id = '[specific-id]';
-- UPDATE conversations SET title = 'Nemo' WHERE id = '[specific-id]';

-- Check that it worked
SELECT id, title, created_at, updated_at FROM conversations; 