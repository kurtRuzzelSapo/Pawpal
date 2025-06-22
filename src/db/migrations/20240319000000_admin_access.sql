-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Enable admin access" ON users;
DROP POLICY IF EXISTS "Enable admin access to posts" ON post;
DROP POLICY IF EXISTS "Enable admin access to communities" ON communities;

-- Create admin policies for users table
CREATE POLICY "Enable admin access"
    ON users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create admin policies for posts table
CREATE POLICY "Enable admin access to posts"
    ON post FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create admin policies for communities table
CREATE POLICY "Enable admin access to communities"
    ON communities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create admin policies for adoption_requests table
CREATE POLICY "Enable admin access to adoption_requests"
    ON adoption_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create admin policies for notifications table
CREATE POLICY "Enable admin access to notifications"
    ON notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    ); 