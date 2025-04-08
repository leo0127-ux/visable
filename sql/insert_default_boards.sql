-- Insert default boards
INSERT INTO public.boards (name, description)
VALUES 
  ('Visa Discussion', 'Discussion about H-1B, Green Card, and other visa topics'),
  ('Resume', 'Share and discuss resume templates, tips, and feedback'),
  ('Career', 'Career development, job search strategies, and professional growth'),
  ('Interview', 'Interview experiences, tips, and preparation resources')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policy for admin-only board creation
CREATE POLICY "Allow only admins to create boards"
ON public.boards
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow all authenticated users to view boards
CREATE POLICY "Allow all users to view boards"
ON public.boards
FOR SELECT
USING (true);
