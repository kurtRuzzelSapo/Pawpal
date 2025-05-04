-- Add the pet_name column to the adoption_requests table
ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS pet_name TEXT; 