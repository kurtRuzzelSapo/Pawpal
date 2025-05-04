-- Add the requester_id column to the notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL; 