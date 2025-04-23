-- Fix the chat room trigger that fails with null created_by values

-- Drop the function with CASCADE to remove all dependent triggers automatically
DROP FUNCTION IF EXISTS public.create_board_chat_room() CASCADE;

-- Create improved trigger function with NULL handling
CREATE OR REPLACE FUNCTION public.create_board_chat_room()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the authenticated user ID, or use board's created_by as fallback
  user_id := COALESCE(auth.uid(), NEW.created_by);
  
  -- Only create chat room if we have a valid user ID
  IF user_id IS NOT NULL THEN
    INSERT INTO public.chat_rooms (
      name, 
      type, 
      board_id, 
      created_at,
      created_by,
      participants
    )
    VALUES (
      NEW.name || ' Chat', 
      'board', 
      NEW.id, 
      now(),
      user_id,
      ARRAY[user_id]
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger with a consistent name
CREATE TRIGGER create_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW
EXECUTE FUNCTION public.create_board_chat_room();

-- Ensure chat_rooms table has the correct constraints
DO $$
BEGIN
  -- Check if created_by column can be NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chat_rooms'
      AND column_name = 'created_by'
      AND is_nullable = 'NO'
  ) THEN
    -- Instead, ensure created_by is populated from the trigger
    RAISE NOTICE 'Keeping created_by column as NOT NULL, ensuring it gets populated properly';
  END IF;
END$$;
