-- Create adoption_requests table
CREATE TABLE adoption_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT REFERENCES post(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  pet_name TEXT,
  CONSTRAINT status_valid CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create notifications table
CREATE TABLE notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  post_id BIGINT REFERENCES post(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add RLS to adoption_requests
ALTER TABLE adoption_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to insert adoption requests
CREATE POLICY "Users can create adoption requests"
  ON adoption_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Requesters can view their own requests
CREATE POLICY "Requesters can view their own requests"
  ON adoption_requests
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

-- Post owners can view adoption requests for their posts
CREATE POLICY "Post owners can view adoption requests for their posts"
  ON adoption_requests
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Post owners can update adoption requests (approve/reject)
CREATE POLICY "Post owners can update adoption requests"
  ON adoption_requests
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add RLS to notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can only view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
