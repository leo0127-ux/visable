-- Fix board_id column type in posts table to match UUID type

-- Step 1: Check the boards table to confirm its ID type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'boards'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    -- If board_id in posts is TEXT, update it to UUID
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'posts'
        AND column_name = 'board_id'
        AND data_type = 'text'
    ) THEN
      -- First create a temporary column
      ALTER TABLE public.posts ADD COLUMN board_id_new UUID;
      
      -- Update the new column with converted values 
      UPDATE public.posts 
      SET board_id_new = board_id::uuid 
      WHERE board_id IS NOT NULL AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      
      -- Drop old column and rename new one
      ALTER TABLE public.posts DROP COLUMN board_id;
      ALTER TABLE public.posts RENAME COLUMN board_id_new TO board_id;
      
      -- Add foreign key constraint if needed
      ALTER TABLE public.posts ADD CONSTRAINT fk_posts_board_id 
        FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE SET NULL;
        
      RAISE NOTICE 'Fixed board_id column in posts table from TEXT to UUID';
    END IF;
  ELSE
    RAISE NOTICE 'Boards table seems to use a non-UUID primary key. No change needed.';
  END IF;
END
$$;

-- Step 2: Update board_followers table if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'board_followers'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'boards'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    -- First create a temporary column
    ALTER TABLE public.board_followers ADD COLUMN board_id_new UUID;
    
    -- Update the new column with converted values 
    UPDATE public.board_followers 
    SET board_id_new = board_id::uuid 
    WHERE board_id IS NOT NULL AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Drop old column and rename new one
    ALTER TABLE public.board_followers DROP COLUMN board_id;
    ALTER TABLE public.board_followers RENAME COLUMN board_id_new TO board_id;
    
    -- Add foreign key constraint if needed
    ALTER TABLE public.board_followers ADD CONSTRAINT fk_board_followers_board_id 
      FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;
      
    RAISE NOTICE 'Fixed board_id column in board_followers table from TEXT to UUID';
  END IF;
END
$$;

-- Step 3: Fix trigger function for new posts on followed boards
CREATE OR REPLACE FUNCTION public.handle_new_post_in_followed_board() 
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  board_name TEXT;
BEGIN
  -- Get board name
  SELECT name INTO board_name FROM public.boards WHERE id = NEW.board_id;
  
  -- Create notifications for each follower
  FOR follower_record IN 
    SELECT user_id FROM public.board_followers WHERE board_id = NEW.board_id
  LOOP
    -- Don't notify the author themselves
    IF follower_record.user_id != NEW.user_id THEN
      INSERT INTO public.notifications (
        user_id, 
        type, 
        title, 
        message,
        target_id,
        link
      ) VALUES (
        follower_record.user_id,
        'follow',
        '您追蹤的板塊有新帖子',
        board_name || ' 板塊有新帖子: ' || NEW.title,
        NEW.id::text, -- Ensure target_id is converted to text
        '/post/' || NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
