-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop existing tables if they exist
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS post CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS adoption_applications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;

-- Create users table with enhanced profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL,
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'vet', 'admin')),
    favorites TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_shelter BOOLEAN DEFAULT FALSE,
    adoption_history TEXT[] DEFAULT ARRAY[]::TEXT[],
    location TEXT DEFAULT '',
    verified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for own profile" ON users;
DROP POLICY IF EXISTS "Enable update access for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;

-- Create RLS policies
CREATE POLICY "Enable read access for own profile"
    ON users FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Enable update access for own profile"
    ON users FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow insert during signup
CREATE POLICY "Enable insert for registration"
    ON users FOR INSERT
    WITH CHECK (true);  -- Allow all inserts, since we're using a trigger

-- Create a function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        user_id,
        bio,
        role,
        favorites,
        is_shelter,
        adoption_history,
        location,
        verified
    ) VALUES (
        NEW.id,  -- auth.users.id
        '',      -- empty bio
        'user',  -- default role
        ARRAY[]::TEXT[],  -- empty favorites
        FALSE,   -- not a shelter
        ARRAY[]::TEXT[],  -- empty adoption history
        '',      -- empty location
        FALSE    -- not verified
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create a user profile after signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

-- Create communities table
CREATE TABLE communities (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT
);

-- Create pet posts table (renamed from post)
CREATE TABLE post (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    avatar_url TEXT,
    community_id BIGINT REFERENCES communities(id),
    age INT4,
    breed TEXT,
    vaccination_status BOOLEAN,
    location TEXT,
    user_id UUID REFERENCES auth.users(id),
    size TEXT CHECK (size IN ('Small', 'Medium', 'Large', 'Extra Large')),
    temperament TEXT[],
    health_info TEXT,
    status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Pending', 'Adopted')),
    additional_photos TEXT[]
);

-- Create adoption applications table
CREATE TABLE adoption_applications (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    post_id BIGINT REFERENCES post(id),
    applicant_id UUID REFERENCES auth.users(id),
    home_situation TEXT,
    experience TEXT,
    why_this_pet TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    additional_info TEXT
);

-- Create messaging system
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT,
    read BOOLEAN DEFAULT FALSE,
    related_post_id BIGINT REFERENCES post(id)
);

-- Create user badges
CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    badge_type TEXT CHECK (badge_type IN ('Verified Adopter', 'Verified Shelter', 'Super Adopter', 'Community Champion')),
    awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    post_id BIGINT REFERENCES post(id),
    content TEXT,
    user_id UUID REFERENCES auth.users(id),
    author TEXT,
    parent_comment_id BIGINT REFERENCES comments(id)
);

-- Create votes table
CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    post_id BIGINT REFERENCES post(id),
    user_id UUID REFERENCES auth.users(id),
    vote INT4
);

-- Create necessary indexes
CREATE INDEX idx_post_location ON post(location);
CREATE INDEX idx_post_breed ON post(breed);
CREATE INDEX idx_post_age ON post(age);
CREATE INDEX idx_post_status ON post(status);
CREATE INDEX idx_messages_users ON messages(sender_id, receiver_id);
CREATE INDEX idx_applications_post ON adoption_applications(post_id);
CREATE INDEX idx_applications_status ON adoption_applications(status);

-- Create RPC function for getting posts with counts and filters
CREATE OR REPLACE FUNCTION get_filtered_posts(
    breed_filter TEXT DEFAULT NULL,
    age_min INT DEFAULT NULL,
    age_max INT DEFAULT NULL,
    location_filter TEXT DEFAULT NULL,
    size_filter TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    image_url TEXT,
    avatar_url TEXT,
    age INT4,
    breed TEXT,
    location TEXT,
    size TEXT,
    status TEXT,
    like_count BIGINT,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.content,
        p.created_at,
        p.image_url,
        p.avatar_url,
        p.age,
        p.breed,
        p.location,
        p.size,
        p.status,
        COALESCE(v.vote_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count
    FROM post p
    LEFT JOIN (
        SELECT post_id, COUNT(*) as vote_count
        FROM votes
        GROUP BY post_id
    ) v ON p.id = v.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY post_id
    ) c ON p.id = c.post_id
    WHERE 
        (breed_filter IS NULL OR p.breed ILIKE '%' || breed_filter || '%')
        AND (age_min IS NULL OR p.age >= age_min)
        AND (age_max IS NULL OR p.age <= age_max)
        AND (location_filter IS NULL OR p.location ILIKE '%' || location_filter || '%')
        AND (size_filter IS NULL OR p.size = size_filter)
        AND (status_filter IS NULL OR p.status = status_filter)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql; 