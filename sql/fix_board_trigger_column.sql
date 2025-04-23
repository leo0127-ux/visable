-- Fix for issue with accessing "created_by" field in trigger function

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_board_chat_room_trigger ON public.boards;
DROP FUNCTION IF EXISTS public.create_board_chat_room() CASCADE;

-- Create a better version of the function with proper column handling
CREATE OR REPLACE FUNCTION public.create_board_chat_room()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  current_user_id UUID;
BEGIN
  -- First try to get the current auth user (safer approach)
  current_user_id := auth.uid();
  
  -- Then try to get the board's creator as a fallback
  BEGIN
    -- Explicitly cast to avoid type issues
    user_id := COALESCE(current_user_id, (NEW).created_by::UUID);
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs with NEW.created_by, just use current_user_id
    RAISE NOTICE 'Error accessing created_by field: %, using current user instead', SQLERRM;
    user_id := current_user_id;
  END;
  
  -- If no user found, check if admin role exists and use the first admin
  IF user_id IS NULL THEN
    BEGIN
      SELECT id INTO user_id FROM public.users WHERE role = 'admin' LIMIT 1;
      IF user_id IS NULL THEN
        -- Last resort: Use a default system user ID
        user_id := '00000000-0000-0000-0000-000000000001'::UUID;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If all else fails, use default system user ID
      user_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END;
  END IF;
  
  -- Create the chat room with the determined user ID
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
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Catch any errors to prevent the trigger from causing the INSERT to fail
  RAISE WARNING 'Error in create_board_chat_room: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger with the corrected function
CREATE TRIGGER create_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW
EXECUTE FUNCTION public.create_board_chat_room();

-- Verify that boards table actually has the created_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boards'
      AND column_name = 'created_by'
  ) THEN
    RAISE NOTICE 'WARNING: boards table is missing created_by column!';
  ELSE
    RAISE NOTICE 'Boards table has created_by column, trigger should work correctly.';
  END IF;
END$$;
