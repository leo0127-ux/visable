-- Function to get chat room statistics
CREATE OR REPLACE FUNCTION public.get_chat_room_stats(room_id UUID)
RETURNS JSON AS $$
DECLARE
  total_members INTEGER;
  online_members INTEGER;
  result JSON;
BEGIN
  -- Get total members count
  SELECT COUNT(*) INTO total_members
  FROM chat_participants
  WHERE chat_room_id = room_id AND status = 'active';
  
  -- In a real application, you would track online status with Supabase Presence
  -- For now, we'll simulate online users as ~30% of total
  online_members := GREATEST(1, FLOOR(total_members * 0.3));
  
  -- Create result JSON
  result := json_build_object(
    'totalMembers', total_members,
    'onlineMembers', online_members
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to automatically create a chat room for a board if one doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_board_chat_room()
RETURNS TRIGGER AS $$
DECLARE
  existing_room_id UUID;
BEGIN
  -- Check if a chat room already exists for this board
  SELECT id INTO existing_room_id
  FROM public.chat_rooms
  WHERE board_id = NEW.id;
  
  -- If no chat room exists, create one
  IF existing_room_id IS NULL THEN
    INSERT INTO public.chat_rooms (name, type, board_id, created_by)
    VALUES (NEW.name || ' Chat', 'board', NEW.id, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure every board has a chat room
DROP TRIGGER IF EXISTS ensure_board_chat_room_trigger ON public.boards;
CREATE TRIGGER ensure_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.ensure_board_chat_room();

-- Update existing boards to ensure they all have chat rooms
DO $$
DECLARE
  board_rec RECORD;
  admin_user_id UUID;
BEGIN
  -- Get a default admin user ID or use NULL if none exists
  SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  
  FOR board_rec IN SELECT id, name FROM public.boards LOOP
    -- Check if a chat room already exists for this board
    IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE board_id = board_rec.id) THEN
      -- Create a chat room for this board using a default user ID
      INSERT INTO public.chat_rooms (name, type, board_id, created_by)
      VALUES (board_rec.name || ' Chat', 'board', board_rec.id, admin_user_id);
    END IF;
  END LOOP;
END $$;
