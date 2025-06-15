-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

-- Policy for users to insert their own profile during signup
CREATE POLICY "Enable insert for users during signup"
ON users
FOR INSERT
WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- Policy for users to view their own profile
CREATE POLICY "Enable read access for users own profile"
ON users
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to update their own profile
CREATE POLICY "Enable update for users own profile"
ON users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own profile
CREATE POLICY "Enable delete for users own profile"
ON users
FOR DELETE
USING (auth.uid() = user_id); 