-- إنشاء جدول العقود
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  contract_number TEXT NOT NULL UNIQUE DEFAULT generate_contract_number(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  renewal_period_months INTEGER DEFAULT 12,
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  currency currency_type NOT NULL DEFAULT 'IQD',
  installation_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_contract_status CHECK (status IN ('active', 'expired', 'suspended', 'cancelled', 'pending'))
);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_contracts_subscriber ON public.contracts(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);

-- تفعيل RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Admins can manage contracts'
  ) THEN
    CREATE POLICY "Admins can manage contracts"
      ON public.contracts
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Accountants can view and create contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Accountants can view contracts'
  ) THEN
    CREATE POLICY "Accountants can view contracts"
      ON public.contracts
      FOR SELECT
      USING (has_role(auth.uid(), 'accountant'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Accountants can create contracts'
  ) THEN
    CREATE POLICY "Accountants can create contracts"
      ON public.contracts
      FOR INSERT
      WITH CHECK (has_role(auth.uid(), 'accountant'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Accountants can update contracts'
  ) THEN
    CREATE POLICY "Accountants can update contracts"
      ON public.contracts
      FOR UPDATE
      USING (has_role(auth.uid(), 'accountant'::app_role));
  END IF;
END $$;

-- Clients can view their own contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Clients can view their contracts'
  ) THEN
    CREATE POLICY "Clients can view their contracts"
      ON public.contracts
      FOR SELECT
      USING (
        has_role(auth.uid(), 'client'::app_role) AND
        subscriber_id IN (
          SELECT subscriber_id FROM subscriber_users WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- دالة لتوليد رقم العقد
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.contracts;
  v_number := 'CNT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- دالة للتحقق من العقود المنتهية وتحديثها
CREATE OR REPLACE FUNCTION check_expired_contracts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تحديث العقود المنتهية
  UPDATE public.contracts
  SET status = 'expired'
  WHERE end_date < CURRENT_DATE
    AND status = 'active';
  
  -- التجديد التلقائي للعقود المفعل لها الخيار
  UPDATE public.contracts
  SET 
    start_date = end_date,
    end_date = end_date + INTERVAL '1 month' * renewal_period_months,
    status = 'active',
    updated_at = NOW()
  WHERE auto_renew = true
    AND end_date < CURRENT_DATE
    AND status = 'expired';
END;
$$;

-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إضافة audit log للعقود
CREATE OR REPLACE FUNCTION log_contract_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'CREATE', 'contracts', NEW.id, row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', 'contracts', NEW.id, row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'contracts', OLD.id, row_to_json(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS contracts_audit_log ON public.contracts;
CREATE TRIGGER contracts_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_changes();