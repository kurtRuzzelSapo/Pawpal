ALTER TABLE users
ADD COLUMN IF NOT EXISTS adoption_validation JSONB;
