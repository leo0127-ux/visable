-- 恢复触发器问题，解决数据丢失

-- 1. 首先禁用有问题的触发器，防止进一步数据丢失
DROP TRIGGER IF EXISTS create_board_chat_room_trigger ON public.boards;

-- 2. 创建一个更安全的触发器函数
CREATE OR REPLACE FUNCTION public.create_board_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在有创建者ID的情况下创建聊天室
  IF NEW.created_by IS NOT NULL THEN
    BEGIN
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
        NEW.created_by,
        ARRAY[NEW.created_by]
      );
    EXCEPTION WHEN OTHERS THEN
      -- 捕获并记录错误，但不阻止board创建
      RAISE WARNING 'Error creating chat room: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 重新创建触发器，但带有更多防护措施
CREATE TRIGGER create_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW
WHEN (NEW.created_by IS NOT NULL)
EXECUTE FUNCTION public.create_board_chat_room();

-- 4. 检查丢失的数据并修复
DO $$
DECLARE
  missing_boards_count INTEGER;
BEGIN
  -- 统计丢失的boards数量
  SELECT COUNT(*) INTO missing_boards_count
  FROM public.boards
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_rooms WHERE board_id = boards.id
  );
  
  RAISE NOTICE '发现 % 个没有对应聊天室的版块', missing_boards_count;
  
  -- 如果有丢失的数据，尝试恢复
  IF missing_boards_count > 0 THEN
    INSERT INTO public.chat_rooms (name, type, board_id, created_by, participants)
    SELECT 
      boards.name || ' Chat', 
      'board', 
      boards.id, 
      boards.created_by,
      ARRAY[boards.created_by]
    FROM 
      public.boards
    WHERE 
      NOT EXISTS (
        SELECT 1 FROM public.chat_rooms WHERE board_id = boards.id
      )
      AND boards.created_by IS NOT NULL;
      
    RAISE NOTICE '已尝试恢复丢失的聊天室数据';
  END IF;
END $$;
