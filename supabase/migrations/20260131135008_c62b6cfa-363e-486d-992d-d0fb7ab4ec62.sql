-- Add approved column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- Add approved_at timestamp
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Add approved_by to track who approved
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- Create index for faster queries on pending approvals
CREATE INDEX IF NOT EXISTS idx_user_roles_approved ON public.user_roles(approved);

-- Update existing roles to be approved (for current users)
UPDATE public.user_roles SET approved = true WHERE approved IS NULL;