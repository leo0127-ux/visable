-- 首先，安全地刪除現有觸發器和函數
DROP TRIGGER IF EXISTS create_board_chat_room_trigger ON public.boards;
DROP FUNCTION IF EXISTS public.create_board_chat_room() CASCADE;

-- 創建更安全的觸發器函數，使用 auth.uid() 而不是依賴 created_by 列
CREATE OR REPLACE FUNCTION public.create_board_chat_room()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- 使用當前認證用戶 ID 作為創建者
  creator_id := auth.uid();
  
  -- 如果當前無認證用戶，則使用系統默認用戶
  IF creator_id IS NULL THEN
    -- 可以設置一個系統默認用戶 ID 或者跳過創建聊天室
    RAISE WARNING 'No authenticated user found when creating board chat room';
    RETURN NEW;
  END IF;
  
  -- 創建新的聊天室
  INSERT INTO public.chat_rooms (
    name, 
    type, 
    board_id, 
    created_by,
    participants
  )
  VALUES (
    NEW.name || ' Chat', 
    'board', 
    NEW.id, 
    creator_id,
    ARRAY[creator_id]
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- 捕获所有错误，但允许板块创建继续
    RAISE WARNING 'Error creating chat room: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 重新创建触发器，不使用WHEN条件检查created_by
CREATE TRIGGER create_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW
EXECUTE FUNCTION public.create_board_chat_room();
