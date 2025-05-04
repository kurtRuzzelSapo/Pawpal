-- Add the post_id column to the notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS post_id BIGINT REFERENCES post(id) ON DELETE CASCADE; 