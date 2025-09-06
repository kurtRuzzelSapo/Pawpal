-- Fix for image upload in chat messages
-- Run this SQL in your Supabase SQL Editor

-- Add image_url column to messages table if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.image_url IS 'URL of image attached to the message';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
AND column_name = 'image_url';
