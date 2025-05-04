-- Add notification_count column to users table to track unread notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS unread_notifications INTEGER DEFAULT 0;

-- Add RLS policy to allow updating unread_notifications
CREATE POLICY "Users can update their own unread_notifications"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid()); 