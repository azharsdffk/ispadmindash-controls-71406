
-- ==========================================
-- إضافة سياسات INSERT المفقودة للجداول الأساسية
-- ==========================================

-- 1. audit_logs - يتم الإدخال عبر triggers
CREATE POLICY "System triggers can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 2. agents - المشرفون فقط
CREATE POLICY "Admins can insert agents" ON public.agents
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. auto_billing_settings
CREATE POLICY "Admins can insert billing settings" ON public.auto_billing_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. complaints
CREATE POLICY "Authenticated users can create complaints" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. coupon_usage
CREATE POLICY "Auth users can insert coupon usage" ON public.coupon_usage
  FOR INSERT TO authenticated
  WITH CHECK (used_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 6. discount_coupons
CREATE POLICY "Admins can insert discount coupons" ON public.discount_coupons
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. employee_access_logs
CREATE POLICY "Auth users can insert access logs" ON public.employee_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (accessed_by = auth.uid());

-- 8. employee_location_access_logs
CREATE POLICY "Auth users can insert location logs" ON public.employee_location_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (accessor_id = auth.uid());

-- 9. exchange_rates
CREATE POLICY "Admins can insert exchange rates" ON public.exchange_rates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. expense_vouchers
CREATE POLICY "Admins accountants insert vouchers" ON public.expense_vouchers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'accountant')
  );

-- 11. external_imports
CREATE POLICY "Admins can insert external imports" ON public.external_imports
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. geofence_events
CREATE POLICY "Auth users can insert geofence events" ON public.geofence_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 13. geofence_zones
CREATE POLICY "Admins can insert geofence zones" ON public.geofence_zones
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. import_logs
CREATE POLICY "Admins can insert import logs" ON public.import_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. inventory
CREATE POLICY "Admins can insert inventory" ON public.inventory
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 16. inventory_movements
CREATE POLICY "Admins accountants insert inventory movements" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'accountant')
  );

-- 17. invoices
CREATE POLICY "Admins accountants insert invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'accountant')
  );

-- 18. location_tracking_settings
CREATE POLICY "Users can insert own tracking settings" ON public.location_tracking_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 19. login_attempts - عبر database function فقط
-- لا نضيف سياسة مباشرة - يتم عبر insert_login_attempt function

-- 20. loyalty_points
CREATE POLICY "Admins can insert loyalty points" ON public.loyalty_points
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 21. loyalty_transactions
CREATE POLICY "Admins can insert loyalty transactions" ON public.loyalty_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 22. mac_address_history
CREATE POLICY "Admins technicians insert mac history" ON public.mac_address_history
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'technician')
  );

-- 23. notification_rules
CREATE POLICY "Admins can insert notification rules" ON public.notification_rules
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 24. otp_rate_limits - عبر database function فقط

-- 25. otp_verification_attempts - عبر database function فقط

-- 26. packages
CREATE POLICY "Admins can insert packages" ON public.packages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 27. password_reset_tokens - عبر database function

-- 28. payments
CREATE POLICY "Admins accountants insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'accountant')
  );

-- 29. permissions
CREATE POLICY "Admins can insert permissions" ON public.permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 30. phone_otps - عبر database function

-- 31. pii_access_logs
CREATE POLICY "Auth users can insert pii logs" ON public.pii_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 32. profiles - يتم عبر trigger عند إنشاء المستخدم
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 33. promotional_offers
CREATE POLICY "Admins can insert promotional offers" ON public.promotional_offers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 34. rate_limit_attempts - عبر database function

-- 35. referrals
CREATE POLICY "Admins can insert referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 36. role_permissions
CREATE POLICY "Admins can insert role permissions" ON public.role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 37. schedule
CREATE POLICY "Admins can insert schedule" ON public.schedule
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 38. sms_settings
CREATE POLICY "Admins can insert sms settings" ON public.sms_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 39. sms_templates
CREATE POLICY "Admins can insert sms templates" ON public.sms_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 40. technician_locations
CREATE POLICY "Technicians can insert own location" ON public.technician_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'technician') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- 41. technician_stats - عبر trigger

-- 42. technicians
CREATE POLICY "Admins can insert technicians" ON public.technicians
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 43. user_roles
CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 44. visit_logs
CREATE POLICY "Technicians can insert visit logs" ON public.visit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'technician') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- 45. vouchers
CREATE POLICY "Admins accountants insert vouchers general" ON public.vouchers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'accountant')
  );
