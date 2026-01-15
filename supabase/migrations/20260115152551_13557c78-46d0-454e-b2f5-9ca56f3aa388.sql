
-- إضافة الأدوار الجديدة إلى enum (يجب أن تكون في transaction منفصلة)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'technical_manager' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'technical_manager';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'finance_manager' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'finance_manager';
  END IF;
END $$;
