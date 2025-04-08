-- Add board_name column to posts table
ALTER TABLE public.posts
ADD COLUMN board_name character varying(100);

-- Update existing rows to fill in the board_name
UPDATE public.posts p
SET board_name = b.name
FROM public.boards b
WHERE p.board_id = b.id;

-- Create a trigger function to automatically maintain the board name
CREATE OR REPLACE FUNCTION public.update_post_board_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.board_id IS NOT NULL THEN
    NEW.board_name := (SELECT name FROM public.boards WHERE id = NEW.board_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update board_name when board_id changes
CREATE TRIGGER update_post_board_name_trigger
BEFORE INSERT OR UPDATE OF board_id ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_post_board_name();
