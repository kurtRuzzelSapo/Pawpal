-- Make sure all required columns and changes are present in the database

-- Ensure notifications table has all required columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS post_id BIGINT REFERENCES post(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add RPC function to get user names directly from auth.users when profiles table doesn't exist
CREATE OR REPLACE FUNCTION get_user_name(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Attempt to get user data from auth.users as fallback
  SELECT 
    COALESCE(raw_user_meta_data->>'full_name', email)
  INTO user_full_name
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_full_name;
END;
$$;

-- Ensure proper foreign key definitions for adoption_requests
ALTER TABLE adoption_requests DROP CONSTRAINT IF EXISTS adoption_requests_requester_id_fkey;
ALTER TABLE adoption_requests ADD CONSTRAINT adoption_requests_requester_id_fkey 
  FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE adoption_requests DROP CONSTRAINT IF EXISTS adoption_requests_owner_id_fkey;
ALTER TABLE adoption_requests ADD CONSTRAINT adoption_requests_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE adoption_requests DROP CONSTRAINT IF EXISTS adoption_requests_post_id_fkey;
ALTER TABLE adoption_requests ADD CONSTRAINT adoption_requests_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE;

-- Make sure adoption_requests table has all constraints
ALTER TABLE adoption_requests DROP CONSTRAINT IF EXISTS status_valid;
ALTER TABLE adoption_requests ADD CONSTRAINT status_valid CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add updated_at to adoption_requests if it doesn't exist
ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add missing RLS policies
DROP POLICY IF EXISTS "Users can update their adoption requests" ON adoption_requests;
CREATE POLICY "Users can update their adoption requests"
  ON adoption_requests
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid() AND status = 'pending');

-- Add policy to prevent cancellation of approved requests
DROP POLICY IF EXISTS "Users can delete their pending adoption requests" ON adoption_requests;
CREATE POLICY "Users can delete their pending adoption requests"
  ON adoption_requests
  FOR DELETE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending');

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_adoption_requests_post_id ON adoption_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_requester_id ON adoption_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_owner_id ON adoption_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Add RLS policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Add trigger to create profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();