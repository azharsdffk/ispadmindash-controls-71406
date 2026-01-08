
-- =====================================================
-- إصلاح سياسات RLS - تقييد الوصول للمستخدمين المصادق عليهم
-- =====================================================

-- 1. تحديث سياسات جدول admin_pii_access_logs
DROP POLICY IF EXISTS "Only admins can view admin access logs" ON public.admin_pii_access_logs;
CREATE POLICY "Only admins can view admin access logs" ON public.admin_pii_access_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. تحديث سياسات جدول agents
DROP POLICY IF EXISTS "Agents are publicly viewable" ON public.agents;
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;

CREATE POLICY "Authenticated users can view agents" ON public.agents
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage agents" ON public.agents
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. تحديث سياسات جدول audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. تحديث سياسات جدول auto_billing_settings
DROP POLICY IF EXISTS "Admins can manage billing settings" ON public.auto_billing_settings;
CREATE POLICY "Admins can manage billing settings" ON public.auto_billing_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. تحديث سياسات جدول complaints
DROP POLICY IF EXISTS "Admins can manage complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can view their assigned complaints" ON public.complaints;

CREATE POLICY "Admins can manage complaints" ON public.complaints
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view assigned complaints" ON public.complaints
FOR SELECT TO authenticated
USING (assigned_to = auth.uid());

-- 6. تحديث سياسات جدول connection_history
DROP POLICY IF EXISTS "Admins can manage connection history" ON public.connection_history;
DROP POLICY IF EXISTS "Admins can view connection history" ON public.connection_history;

CREATE POLICY "Admins can manage connection history" ON public.connection_history
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. تحديث سياسات جدول contracts
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;

CREATE POLICY "Admins can manage contracts" ON public.contracts
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. تحديث سياسات جدول discount_coupons
DROP POLICY IF EXISTS "Admins can manage discount coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.discount_coupons;

CREATE POLICY "Admins can manage discount coupons" ON public.discount_coupons
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active coupons" ON public.discount_coupons
FOR SELECT TO authenticated
USING (active = true);

-- 9. تحديث سياسات جدول employees
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;

CREATE POLICY "Admins can manage employees" ON public.employees
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own employee record" ON public.employees
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 10. تحديث سياسات جدول employee_locations
DROP POLICY IF EXISTS "Admins can view all locations" ON public.employee_locations;
DROP POLICY IF EXISTS "Users can manage own location" ON public.employee_locations;

CREATE POLICY "Admins can view all locations" ON public.employee_locations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own location" ON public.employee_locations
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 11. تحديث سياسات جدول exchange_rates
DROP POLICY IF EXISTS "Admins can manage exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Anyone can view exchange rates" ON public.exchange_rates;

CREATE POLICY "Admins can manage exchange rates" ON public.exchange_rates
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view exchange rates" ON public.exchange_rates
FOR SELECT TO authenticated USING (true);

-- 12. تحديث سياسات جدول expense_vouchers
DROP POLICY IF EXISTS "Admins and accountants can manage expense vouchers" ON public.expense_vouchers;

CREATE POLICY "Admins and accountants can manage expense vouchers" ON public.expense_vouchers
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- 13. تحديث سياسات جدول geofence_zones
DROP POLICY IF EXISTS "Admins can manage geofence zones" ON public.geofence_zones;
DROP POLICY IF EXISTS "Anyone can view active zones" ON public.geofence_zones;

CREATE POLICY "Admins can manage geofence zones" ON public.geofence_zones
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active zones" ON public.geofence_zones
FOR SELECT TO authenticated
USING (active = true);

-- 14. تحديث سياسات جدول inventory
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory;

CREATE POLICY "Admins can manage inventory" ON public.inventory
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view inventory" ON public.inventory
FOR SELECT TO authenticated USING (true);

-- 15. تحديث سياسات جدول invoices
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;

CREATE POLICY "Admins can manage invoices" ON public.invoices
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- 16. تحديث سياسات جدول maintenance_tickets
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Technicians can view assigned tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Technicians can update assigned tickets" ON public.maintenance_tickets;

CREATE POLICY "Admins can manage all tickets" ON public.maintenance_tickets
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view assigned tickets" ON public.maintenance_tickets
FOR SELECT TO authenticated
USING (technician_id = auth.uid() OR public.has_role(auth.uid(), 'technician'));

CREATE POLICY "Technicians can update assigned tickets" ON public.maintenance_tickets
FOR UPDATE TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- 17. تحديث سياسات جدول notifications
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can manage own notifications" ON public.notifications
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 18. تحديث سياسات جدول packages
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;

CREATE POLICY "Admins can manage packages" ON public.packages
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active packages" ON public.packages
FOR SELECT TO authenticated
USING (active = true);

-- 19. تحديث سياسات جدول payments
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

CREATE POLICY "Admins can manage payments" ON public.payments
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- 20. تحديث سياسات جدول profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 21. تحديث سياسات جدول subscribers
DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON public.subscribers;

CREATE POLICY "Admins can manage subscribers" ON public.subscribers
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view subscribers" ON public.subscribers
FOR SELECT TO authenticated USING (true);

-- 22. تحديث سياسات جدول technicians
DROP POLICY IF EXISTS "Admins can manage technicians" ON public.technicians;
DROP POLICY IF EXISTS "Anyone can view technicians" ON public.technicians;

CREATE POLICY "Admins can manage technicians" ON public.technicians
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view technicians" ON public.technicians
FOR SELECT TO authenticated USING (true);

-- 23. تحديث سياسات جدول user_roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 24. تحديث سياسات جدول sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users update own sessions" ON public.sessions;

CREATE POLICY "Admins can view all sessions" ON public.sessions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own sessions" ON public.sessions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 25. تحديث سياسات جدول sms_logs
DROP POLICY IF EXISTS "Admins can manage SMS logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Admins can view SMS logs" ON public.sms_logs;

CREATE POLICY "Admins can manage SMS logs" ON public.sms_logs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 26. تحديث سياسات جدول schedule
DROP POLICY IF EXISTS "Admins can manage schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can view assigned schedule" ON public.schedule;

CREATE POLICY "Admins can manage schedule" ON public.schedule
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view assigned schedule" ON public.schedule
FOR SELECT TO authenticated
USING (assigned_to = auth.uid());
