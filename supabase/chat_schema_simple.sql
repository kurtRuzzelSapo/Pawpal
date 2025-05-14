-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles security policies
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
        CREATE POLICY "Users can view all profiles" 
            ON public.profiles FOR SELECT 
            USING (true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
        CREATE POLICY "Users can update their own profile" 
            ON public.profiles FOR UPDATE 
            USING (auth.uid() = id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
        CREATE POLICY "Users can insert their own profile" 
            ON public.profiles FOR INSERT 
            WITH CHECK (auth.uid() = id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
END
$$;

-- Try enabling realtime for profiles (outside DO block)
ALTER PUBLICATION IF EXISTS supabase_realtime ADD TABLE public.profiles;

-- Create trigger function to create profile record on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NULL)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop tables if they exist (handling the case where they might not exist)
DO $$
BEGIN
    -- Try to drop tables in the correct order
    BEGIN
        DROP TABLE IF EXISTS public.messages;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping messages table: %', SQLERRM;
    END;
    
    BEGIN
        DROP TABLE IF EXISTS public.user_conversations;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping user_conversations table: %', SQLERRM;
    END;
    
    BEGIN
        DROP TABLE IF EXISTS public.conversations;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping conversations table: %', SQLERRM;
    END;
END
$$;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,
    is_group BOOLEAN DEFAULT false
);

-- Create user_conversations table
CREATE TABLE IF NOT EXISTS public.user_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false
);

-- Create indexes for better performance
DO $$
BEGIN
    BEGIN
        CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating index: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX idx_messages_created_at ON public.messages(created_at);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating index: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX idx_user_conversations_user_id ON public.user_conversations(user_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating index: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX idx_user_conversations_conversation_id ON public.user_conversations(conversation_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating index: %', SQLERRM;
    END;
END
$$;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Handle policies with error handling
DO $$
BEGIN
    -- Policies for conversations
    BEGIN
        DROP POLICY IF EXISTS "Users can view conversations they're part of" ON public.conversations;
        CREATE POLICY "Users can view conversations they're part of" 
            ON public.conversations FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_conversations
                    WHERE user_conversations.conversation_id = conversations.id
                    AND user_conversations.user_id = auth.uid()
                )
            );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
        CREATE POLICY "Users can insert conversations" 
            ON public.conversations FOR INSERT 
            WITH CHECK (true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update conversations they're part of" ON public.conversations;
        CREATE POLICY "Users can update conversations they're part of" 
            ON public.conversations FOR UPDATE 
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_conversations
                    WHERE user_conversations.conversation_id = conversations.id
                    AND user_conversations.user_id = auth.uid()
                )
            );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    -- Policies for user_conversations
    BEGIN
        DROP POLICY IF EXISTS "Users can view their own conversation memberships" ON public.user_conversations;
        CREATE POLICY "Users can view their own conversation memberships" 
            ON public.user_conversations FOR SELECT 
            USING (user_id = auth.uid());
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert conversation memberships" ON public.user_conversations;
        CREATE POLICY "Users can insert conversation memberships" 
            ON public.user_conversations FOR INSERT 
            WITH CHECK (true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update their own conversation memberships" ON public.user_conversations;
        CREATE POLICY "Users can update their own conversation memberships" 
            ON public.user_conversations FOR UPDATE 
            USING (user_id = auth.uid());
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    -- Policies for messages
    BEGIN
        DROP POLICY IF EXISTS "Users can view messages in conversations they're part of" ON public.messages;
        CREATE POLICY "Users can view messages in conversations they're part of" 
            ON public.messages FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_conversations
                    WHERE user_conversations.conversation_id = messages.conversation_id
                    AND user_conversations.user_id = auth.uid()
                )
            );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert messages in conversations they're part of" ON public.messages;
        CREATE POLICY "Users can insert messages in conversations they're part of" 
            ON public.messages FOR INSERT 
            WITH CHECK (
                sender_id = auth.uid() AND
                EXISTS (
                    SELECT 1 FROM public.user_conversations
                    WHERE user_conversations.conversation_id = conversation_id
                    AND user_conversations.user_id = auth.uid()
                )
            );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
    END;
END
$$;

-- Try enabling realtime (outside DO block)
ALTER PUBLICATION IF EXISTS supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION IF EXISTS supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION IF EXISTS supabase_realtime ADD TABLE public.user_conversations; 