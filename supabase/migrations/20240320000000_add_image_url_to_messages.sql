-- Add image_url column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.image_url IS 'URL of image attached to the message';
