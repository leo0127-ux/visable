-- Create vpoint transactions table
CREATE TABLE IF NOT EXISTS public.vpoint_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earn', 'spend')),
  description text NOT NULL,
  related_id uuid, -- Optional reference to the related entity (post, career insight, etc.)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vpoint_transactions_pkey PRIMARY KEY (id)
);

-- Enable row level security
ALTER TABLE public.vpoint_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.vpoint_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vpoint_transactions_user_id ON public.vpoint_transactions(user_id);
