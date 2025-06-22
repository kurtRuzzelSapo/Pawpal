-- Drop existing post policies
DROP POLICY IF EXISTS "Anyone can view posts" ON post;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON post;
DROP POLICY IF EXISTS "Users can update their own posts" ON post;
DROP POLICY IF EXISTS "Users can delete their own posts" ON post;
DROP POLICY IF EXISTS "Enable admin access to posts" ON post;

-- Create new post policies
CREATE POLICY "Anyone can view posts"
    ON post FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON post FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.uid() = auth_users_id);

CREATE POLICY "Users can update their own posts"
    ON post FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = auth_users_id);

CREATE POLICY "Users can delete their own posts"
    ON post FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = auth_users_id);

-- Allow admin users to access all posts
CREATE POLICY "Enable admin access to posts"
    ON post FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON post TO authenticated;
GRANT ALL ON post TO service_role; 