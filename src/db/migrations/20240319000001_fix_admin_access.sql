-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Enable admin access" ON users;

-- Create admin policy for users table
CREATE POLICY "Enable admin access"
    ON users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role; 