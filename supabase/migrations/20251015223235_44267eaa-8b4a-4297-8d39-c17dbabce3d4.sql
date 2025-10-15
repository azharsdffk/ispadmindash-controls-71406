-- Add accountant role for azhar2322@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'azhar2322@gmail.com';

  -- Check if user exists
  IF v_user_id IS NOT NULL THEN
    -- Add accountant role if not already exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'accountant')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Accountant role added for user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User with email azhar2322@gmail.com not found';
  END IF;
END $$;