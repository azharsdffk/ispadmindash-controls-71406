-- ========================================
-- نظام الخصومات والعروض الترويجية الشامل
-- ========================================

-- 1. جدول كوبونات الخصم
CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  currency currency_type DEFAULT 'IQD',
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  applicable_to TEXT CHECK (applicable_to IN ('all', 'specific_packages', 'specific_subscribers')),
  package_ids UUID[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. جدول استخدام الكوبونات
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id),
  invoice_id UUID REFERENCES public.invoices(id),
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_by UUID REFERENCES auth.users(id)
);

-- 3. جدول العروض الترويجية
CREATE TABLE IF NOT EXISTS public.promotional_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('package_upgrade', 'free_months', 'discount', 'bonus_speed')),
  discount_percentage NUMERIC,
  free_months INTEGER,
  bonus_speed_mbps INTEGER,
  applicable_packages UUID[],
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_apply BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. جدول برنامج الإحالة
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.subscribers(id),
  referred_id UUID REFERENCES public.subscribers(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'cancelled')),
  reward_type TEXT CHECK (reward_type IN ('discount', 'credit', 'free_month')),
  reward_value NUMERIC,
  reward_applied BOOLEAN DEFAULT false,
  referred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE
);

-- 5. جدول برنامج الولاء (نقاط)
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id),
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_discount_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subscriber_id)
);

-- 6. جدول سجل نقاط الولاء
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id),
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  reason TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إنشاء Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.discount_coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.discount_coupons(active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_subscriber ON public.coupon_usage(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_subscriber ON public.loyalty_points(subscriber_id);

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotional_offers_updated_at
  BEFORE UPDATE ON public.promotional_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- تفعيل RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Discount Coupons
CREATE POLICY "Admins can manage discount coupons"
  ON public.discount_coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountants can view discount coupons"
  ON public.discount_coupons FOR SELECT
  USING (has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies - Coupon Usage
CREATE POLICY "Admins can view all coupon usage"
  ON public.coupon_usage FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "System can insert coupon usage"
  ON public.coupon_usage FOR INSERT
  WITH CHECK (true);

-- RLS Policies - Promotional Offers
CREATE POLICY "Admins can manage promotional offers"
  ON public.promotional_offers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All users can view active offers"
  ON public.promotional_offers FOR SELECT
  USING (active = true AND valid_until > now());

-- RLS Policies - Referrals
CREATE POLICY "Admins can manage referrals"
  ON public.referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Subscribers can view their referrals"
  ON public.referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriber_users
      WHERE user_id = auth.uid() 
      AND (subscriber_id = referrals.referrer_id OR subscriber_id = referrals.referred_id)
    )
  );

-- RLS Policies - Loyalty Points
CREATE POLICY "Admins can manage loyalty points"
  ON public.loyalty_points FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Subscribers can view their loyalty points"
  ON public.loyalty_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriber_users
      WHERE user_id = auth.uid() AND subscriber_id = loyalty_points.subscriber_id
    )
  );

-- RLS Policies - Loyalty Transactions
CREATE POLICY "Admins can manage loyalty transactions"
  ON public.loyalty_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Subscribers can view their loyalty transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriber_users
      WHERE user_id = auth.uid() AND subscriber_id = loyalty_transactions.subscriber_id
    )
  );

-- دالة لتوليد رمز إحالة فريد
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_subscriber_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- توليد رمز من 8 أحرف وأرقام
    v_code := upper(substring(md5(random()::text || p_subscriber_id::text) from 1 for 8));
    
    -- التحقق من عدم وجود الرمز
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- دالة لحساب نقاط الولاء بناءً على المدفوعات
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(p_subscriber_id UUID, p_amount NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
  v_current_tier TEXT;
BEGIN
  -- الحصول على المستوى الحالي
  SELECT tier INTO v_current_tier
  FROM public.loyalty_points
  WHERE subscriber_id = p_subscriber_id;
  
  -- حساب النقاط (1 نقطة لكل 10,000 دينار)
  v_points := FLOOR(p_amount / 10000)::INTEGER;
  
  -- مضاعف حسب المستوى
  CASE v_current_tier
    WHEN 'silver' THEN v_points := v_points * 1.25;
    WHEN 'gold' THEN v_points := v_points * 1.5;
    WHEN 'platinum' THEN v_points := v_points * 2;
    ELSE v_points := v_points * 1;
  END CASE;
  
  RETURN v_points;
END;
$$;

-- دالة لتطبيق كوبون خصم
CREATE OR REPLACE FUNCTION public.apply_discount_coupon(
  p_coupon_code TEXT,
  p_subscriber_id UUID,
  p_invoice_amount NUMERIC
)
RETURNS TABLE(success BOOLEAN, discount_amount NUMERIC, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_discount NUMERIC;
BEGIN
  -- البحث عن الكوبون
  SELECT * INTO v_coupon
  FROM public.discount_coupons
  WHERE code = p_coupon_code
    AND active = true
    AND valid_from <= now()
    AND valid_until >= now();
  
  -- التحقق من وجود الكوبون
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'كوبون غير صالح أو منتهي الصلاحية';
    RETURN;
  END IF;
  
  -- التحقق من الحد الأدنى للشراء
  IF p_invoice_amount < v_coupon.min_purchase_amount THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 
      'الحد الأدنى للشراء: ' || v_coupon.min_purchase_amount::TEXT;
    RETURN;
  END IF;
  
  -- التحقق من عدد مرات الاستخدام
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'تم استنفاد هذا الكوبون';
    RETURN;
  END IF;
  
  -- التحقق من استخدام العميل
  SELECT COUNT(*) INTO v_usage_count
  FROM public.coupon_usage
  WHERE coupon_id = v_coupon.id AND subscriber_id = p_subscriber_id;
  
  IF v_usage_count >= v_coupon.per_user_limit THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'لقد استخدمت هذا الكوبون من قبل';
    RETURN;
  END IF;
  
  -- حساب الخصم
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_invoice_amount * v_coupon.discount_value / 100);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  -- تطبيق الحد الأقصى للخصم
  IF v_coupon.max_discount_amount IS NOT NULL THEN
    v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
  END IF;
  
  -- التأكد أن الخصم لا يتجاوز المبلغ
  v_discount := LEAST(v_discount, p_invoice_amount);
  
  RETURN QUERY SELECT true, v_discount, 'تم تطبيق الخصم بنجاح';
END;
$$;