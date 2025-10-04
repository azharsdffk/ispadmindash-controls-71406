-- Add new columns to subscribers table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='subscribers' AND column_name='username') THEN
    ALTER TABLE public.subscribers ADD COLUMN username TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='subscribers' AND column_name='phone_secondary') THEN
    ALTER TABLE public.subscribers ADD COLUMN phone_secondary TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='subscribers' AND column_name='status_comment') THEN
    ALTER TABLE public.subscribers ADD COLUMN status_comment TEXT;
  END IF;
END $$;

-- Insert default packages
INSERT INTO public.packages (name, name_en, speed_mbps, monthly_price, currency, description, active, features)
VALUES 
  ('باقة 50 ميجابايت', '50MB Package', 50, 30000, 'IQD', 'باقة انترنت بسرعة 50 ميجابايت في الثانية', true, '["سرعة 50 ميجابايت", "دعم فني 24/7", "بدون حد للاستخدام"]'::jsonb),
  ('باقة 100 ميجابايت', '100MB Package', 100, 50000, 'IQD', 'باقة انترنت بسرعة 100 ميجابايت في الثانية', true, '["سرعة 100 ميجابايت", "دعم فني 24/7", "بدون حد للاستخدام", "أولوية في الصيانة"]'::jsonb),
  ('باقة 150 ميجابايت', '150MB Package', 150, 70000, 'IQD', 'باقة انترنت بسرعة 150 ميجابايت في الثانية', true, '["سرعة 150 ميجابايت", "دعم فني 24/7", "بدون حد للاستخدام", "أولوية في الصيانة", "IP ثابت"]'::jsonb)
ON CONFLICT DO NOTHING;