-- Setup for chat image storage
-- Run this SQL in your Supabase SQL Editor

-- Create the chat-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the chat-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects
FOR INSERT 
TO authenticated  
WITH CHECK (
  bucket_id = 'chat-images'
);

-- Allow authenticated users to view chat images
CREATE POLICY "Allow authenticated users to view chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images'
);

-- Allow authenticated users to update chat images
CREATE POLICY "Allow authenticated users to update chat images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-images' 
)
WITH CHECK (
  bucket_id = 'chat-images'
);

-- Allow authenticated users to delete chat images
CREATE POLICY "Allow authenticated users to delete chat images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images'
);

-- Allow anonymous users to view chat images (for public access)
CREATE POLICY "Allow anonymous users to view chat images"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'chat-images'
);
