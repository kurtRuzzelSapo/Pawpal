-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    image_url TEXT,
    member_count INTEGER DEFAULT 0,
    UNIQUE(name)
);

-- Create post table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.post (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_users_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    additional_photos TEXT[],
    age INTEGER,
    breed TEXT,
    vaccination_status BOOLEAN DEFAULT false,
    location TEXT,
    size TEXT CHECK (size IN ('Small', 'Medium', 'Large', 'Extra Large')),
    temperament TEXT[],
    health_info TEXT,
    status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Pending', 'Adopted')),
    name TEXT,
    avatar_url TEXT,
    community_id BIGINT REFERENCES public.communities(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE post ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Anyone can view communities"
    ON communities FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create communities"
    ON communities FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Creators can update their communities"
    ON communities FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid());

-- Post policies
CREATE POLICY "Anyone can view posts"
    ON post FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON post FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.uid() = auth_users_id);

CREATE POLICY "Users can update their own posts"
    ON post FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = auth_users_id);

CREATE POLICY "Users can delete their own posts"
    ON post FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = auth_users_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
CREATE INDEX IF NOT EXISTS idx_post_created_at ON post(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_user_id ON post(user_id);
CREATE INDEX IF NOT EXISTS idx_post_auth_users_id ON post(auth_users_id);
CREATE INDEX IF NOT EXISTS idx_post_community_id ON post(community_id);

-- Grant permissions
GRANT ALL ON communities TO authenticated;
GRANT ALL ON post TO authenticated;

-- Create function to update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE communities
    SET member_count = (
        SELECT COUNT(DISTINCT user_id)
        FROM post
        WHERE community_id = NEW.community_id
    )
    WHERE id = NEW.community_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update member count
CREATE TRIGGER update_community_members
    AFTER INSERT OR DELETE ON post
    FOR EACH ROW
    EXECUTE FUNCTION update_community_member_count(); 