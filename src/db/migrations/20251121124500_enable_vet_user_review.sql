-- Allow veterinarians to view pending user accounts for validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'Enable vet review access to users'
      AND tablename = 'users'
  ) THEN
    CREATE POLICY "Enable vet review access to users"
    ON users FOR SELECT
    USING (
      role = 'user' AND
      EXISTS (
        SELECT 1 FROM users reviewer
        WHERE reviewer.user_id = auth.uid()
          AND reviewer.role = 'vet'
      )
    );
  END IF;
END $$;

-- Allow veterinarians to verify (approve) pending user accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'Enable vet verify users'
      AND tablename = 'users'
  ) THEN
    CREATE POLICY "Enable vet verify users"
    ON users FOR UPDATE
    USING (
      role = 'user' AND
      verified = false AND
      EXISTS (
        SELECT 1 FROM users reviewer
        WHERE reviewer.user_id = auth.uid()
          AND reviewer.role = 'vet'
      )
    )
    WITH CHECK (
      role = 'user' AND
      verified = true AND
      EXISTS (
        SELECT 1 FROM users reviewer
        WHERE reviewer.user_id = auth.uid()
          AND reviewer.role = 'vet'
      )
    );
  END IF;
END $$;

