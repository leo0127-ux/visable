-- Fix the board_id type issues in the database
DO $$
BEGIN
  -- Check if there's a need to convert board_id in the board_followers table
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'board_followers'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) THEN
    -- Create temporary column with correct UUID type
    ALTER TABLE public.board_followers ADD COLUMN IF NOT EXISTS board_id_uuid UUID;
    
    -- Update the UUID column with converted values (safely try to cast)
    UPDATE public.board_followers
    SET board_id_uuid = board_id::uuid
    WHERE board_id IS NOT NULL 
      AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Drop the original column and rename the new one
    ALTER TABLE public.board_followers DROP COLUMN board_id;
    ALTER TABLE public.board_followers RENAME COLUMN board_id_uuid TO board_id;
    
    -- Create foreign key constraint to boards table
    ALTER TABLE public.board_followers 
    ADD CONSTRAINT fk_board_followers_board_id
    FOREIGN KEY (board_id) REFERENCES public.boards(id);
    
    RAISE NOTICE 'board_id in board_followers table converted from TEXT to UUID';
  END IF;
  
  -- Check if there's a need to convert board_id in the posts table
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) THEN
    -- Create temporary column with correct UUID type
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS board_id_uuid UUID;
    
    -- Update the UUID column with converted values (safely try to cast)
    UPDATE public.posts
    SET board_id_uuid = board_id::uuid
    WHERE board_id IS NOT NULL 
      AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Drop the original column and rename the new one
    ALTER TABLE public.posts DROP COLUMN board_id;
    ALTER TABLE public.posts RENAME COLUMN board_id_uuid TO board_id;
    
    -- Create foreign key constraint to boards table
    ALTER TABLE public.posts 
    ADD CONSTRAINT fk_posts_board_id
    FOREIGN KEY (board_id) REFERENCES public.boards(id);
    
    RAISE NOTICE 'board_id in posts table converted from TEXT to UUID';
  END IF;
  
  -- Check if there's a need to convert board_id in the chat_rooms table
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chat_rooms'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) THEN
    -- Create temporary column with correct UUID type
    ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS board_id_uuid UUID;
    
    -- Update the UUID column with converted values (safely try to cast)
    UPDATE public.chat_rooms
    SET board_id_uuid = board_id::uuid
    WHERE board_id IS NOT NULL 
      AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Drop the original column and rename the new one
    ALTER TABLE public.chat_rooms DROP COLUMN board_id;
    ALTER TABLE public.chat_rooms RENAME COLUMN board_id_uuid TO board_id;
    
    -- Create foreign key constraint to boards table
    ALTER TABLE public.chat_rooms 
    ADD CONSTRAINT fk_chat_rooms_board_id
    FOREIGN KEY (board_id) REFERENCES public.boards(id);
    
    RAISE NOTICE 'board_id in chat_rooms table converted from TEXT to UUID';
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_followers_board_id ON public.board_followers(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON public.posts(board_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_board_id ON public.chat_rooms(board_id);

-- Ensure foreign key constraints exist for all tables referencing boards
ALTER TABLE IF EXISTS public.board_followers
  DROP CONSTRAINT IF EXISTS fk_board_followers_board_id,
  ADD CONSTRAINT fk_board_followers_board_id FOREIGN KEY (board_id) REFERENCES public.boards(id);
  
ALTER TABLE IF EXISTS public.posts
  DROP CONSTRAINT IF EXISTS fk_posts_board_id,
  ADD CONSTRAINT fk_posts_board_id FOREIGN KEY (board_id) REFERENCES public.boards(id);
  
ALTER TABLE IF EXISTS public.chat_rooms
  DROP CONSTRAINT IF EXISTS fk_chat_rooms_board_id,
  ADD CONSTRAINT fk_chat_rooms_board_id FOREIGN KEY (board_id) REFERENCES public.boards(id);
