-- These policies need to be run in the Supabase SQL Editor

-- Allow users to insert files into the documents bucket
CREATE POLICY "Allow authenticated users to upload files to documents bucket"
ON storage.objects
FOR INSERT 
TO authenticated  
WITH CHECK (
  bucket_id = 'documents'
);

-- Allow users to update files in the documents bucket
CREATE POLICY "Allow authenticated users to update files in documents bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
)
WITH CHECK (
  bucket_id = 'documents'
);

-- Allow users to select/view files from the documents bucket
CREATE POLICY "Allow authenticated users to view files in documents bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
);

-- Allow users to delete files from the documents bucket
CREATE POLICY "Allow authenticated users to delete files in documents bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
);

-- OPTIONAL: Allow anonymous users to see files from the documents bucket
CREATE POLICY "Allow anonymous users to view files in documents bucket"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'documents'
);

-- If you want to restrict users to only manage their own files, 
-- you would need more specific policies like:

-- CREATE POLICY "Allow users to manage their own files"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (
--   auth.uid() = owner_id
-- )
-- WITH CHECK (
--   auth.uid() = owner_id
-- ); 