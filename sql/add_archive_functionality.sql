-- Add is_archived column to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Update policy for editing posts - prevent editing archived posts
DROP POLICY IF EXISTS "Allow users to update their non-archived posts" ON public.posts;
CREATE POLICY "Allow users to update their non-archived posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id AND is_archived = false);

-- Update policy for commenting - prevent commenting on archived posts
DROP POLICY IF EXISTS "Prevent comments on archived posts" ON public.comments;
CREATE POLICY "Prevent comments on archived posts"
ON public.comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = post_id 
    AND posts.is_archived = false
  )
);

-- Update the select policy to include is_archived info
DROP POLICY IF EXISTS "Allow users to view all posts" ON public.posts;
CREATE POLICY "Allow users to view all posts"
ON public.posts
FOR SELECT
USING (true);
