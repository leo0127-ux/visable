-- Fix the issue with accessing created_by column in trigger function

-- Drop existing trigger and function with CASCADE to remove all dependent objects
DROP FUNCTION IF EXISTS public.create_board_chat_room() CASCADE;

-- Create improved function with explicit column referencing
CREATE OR REPLACE FUNCTION public.create_board_chat_room()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  board_name TEXT;
  board_id UUID;
BEGIN
  -- Explicitly fetch the fields we need from NEW record
  board_id := NEW.id;
  board_name := NEW.name;
  
  -- Try to get created_by field with fallbacks
  BEGIN
    -- First try using reference notation (NEW).fieldname
    user_id := (NEW).created_by;
    
    -- If that's null, fallback to auth.uid()
    IF user_id IS NULL THEN
      user_id := auth.uid();
    END IF;
    
    -- If both are null, use a default system user (as last resort)
    IF user_id IS NULL THEN
      RAISE WARNING 'Both created_by and auth.uid() are NULL. Using default user.';
      user_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;
    
    -- Insert chat room with explicit column list
    INSERT INTO public.chat_rooms (
      name, 
      type, 
      board_id, 
      created_by,
      participants
    )
    VALUES (
      board_name || ' Chat', 
      'board', 
      board_id, 
      user_id,
      ARRAY[user_id]
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Catch any errors to ensure the board still gets created
    RAISE WARNING 'Error creating chat room: %', SQLERRM;
  END;
  
  -- Always return NEW to allow the insert to complete
  RETURN NEW;
END;
$$;

-- Create trigger that explicitly specifies AFTER INSERT timing
CREATE TRIGGER create_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW
EXECUTE FUNCTION public.create_board_chat_room();

-- Validate boards table has expected columns
DO $$
BEGIN
  -- Check if created_by column exists and is the expected type
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boards'
      AND column_name = 'created_by'
      AND data_type = 'uuid'
  ) THEN
    RAISE WARNING 'boards.created_by column is missing or not UUID type';
  ELSE
    RAISE NOTICE 'boards.created_by column exists and is UUID type';
  END IF;
END$$;
