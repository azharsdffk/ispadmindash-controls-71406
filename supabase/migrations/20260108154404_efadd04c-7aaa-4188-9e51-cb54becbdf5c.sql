
-- =====================================================
-- إصلاح باقي سياسات RLS - الجزء الثاني
-- =====================================================

-- 1. حذف السياسات المكررة والقديمة

-- connection_history
DROP POLICY IF EXISTS "Admins can view all connection history" ON public.connection_history;
DROP POLICY IF EXISTS "Technicians can view connection history" ON public.connection_history;

-- contracts
DROP POLICY IF EXISTS "Accountants can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Accountants can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can view their contracts" ON public.contracts;

CREATE POLICY "Accountants can view contracts" ON public.contracts
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'accountant'));

-- discount_coupons
DROP POLICY IF EXISTS "Accountants can view discount coupons" ON public.discount_coupons;

-- coupon_usage
DROP POLICY IF EXISTS "Admins can view all coupon usage" ON public.coupon_usage;
CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- employee_access_logs
DROP POLICY IF EXISTS "Admins can view employee access logs" ON public.employee_access_logs;
CREATE POLICY "Admins can view employee access logs" ON public.employee_access_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- employee_location_access_logs
DROP POLICY IF EXISTS "Admins can view location access logs" ON public.employee_location_access_logs;
DROP POLICY IF EXISTS "Prevent location access log deletion" ON public.employee_location_access_logs;
DROP POLICY IF EXISTS "Prevent location access log updates" ON public.employee_location_access_logs;

CREATE POLICY "Admins can view location access logs" ON public.employee_location_access_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- employee_locations - حذف السياسات المكررة
DROP POLICY IF EXISTS "Authenticated users only can access employee_locations" ON public.employee_locations;
DROP POLICY IF EXISTS "Users can view their own location" ON public.employee_locations;

-- employees - حذف السياسات المكررة
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own data" ON public.employees;

-- exchange_rates - حذف السياسات المكررة
DROP POLICY IF EXISTS "Admins and accountants can view exchange rates" ON public.exchange_rates;

-- expense_vouchers - حذف السياسات المكررة
DROP POLICY IF EXISTS "Accountants can manage expense vouchers" ON public.expense_vouchers;
DROP POLICY IF EXISTS "Admins can manage expense vouchers" ON public.expense_vouchers;

-- external_imports
DROP POLICY IF EXISTS "Admins can manage external imports" ON public.external_imports;
DROP POLICY IF EXISTS "Admins can view external imports" ON public.external_imports;

CREATE POLICY "Admins can manage external imports" ON public.external_imports
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- geofence_events
DROP POLICY IF EXISTS "Admins can view geofence events" ON public.geofence_events;
DROP POLICY IF EXISTS "Users can view their geofence events" ON public.geofence_events;

CREATE POLICY "Admins can view geofence events" ON public.geofence_events
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their geofence events" ON public.geofence_events
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- geofence_zones - حذف السياسة المكررة
DROP POLICY IF EXISTS "Only admins can view geofence zones" ON public.geofence_zones;

-- import_logs
DROP POLICY IF EXISTS "Admins can manage import logs" ON public.import_logs;
CREATE POLICY "Admins can manage import logs" ON public.import_logs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- inventory - حذف السياسات المكررة
DROP POLICY IF EXISTS "Admins and accountants can view inventory" ON public.inventory;

-- inventory_movements
DROP POLICY IF EXISTS "Accountants can view inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Admins can manage inventory movements" ON public.inventory_movements;

CREATE POLICY "Admins can manage inventory movements" ON public.inventory_movements
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view inventory movements" ON public.inventory_movements
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'accountant'));

-- invoices - حذف السياسات المكررة
DROP POLICY IF EXISTS "Accountants can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.invoices;

-- location_tracking_settings
DROP POLICY IF EXISTS "Admins can view all tracking settings" ON public.location_tracking_settings;
DROP POLICY IF EXISTS "Users can manage their own tracking settings" ON public.location_tracking_settings;

CREATE POLICY "Admins can view all tracking settings" ON public.location_tracking_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own tracking settings" ON public.location_tracking_settings
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- login_attempts
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Prevent login attempts deletion" ON public.login_attempts;
DROP POLICY IF EXISTS "Prevent login attempts updates" ON public.login_attempts;

CREATE POLICY "Admins can view login attempts" ON public.login_attempts
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- loyalty_points
DROP POLICY IF EXISTS "Admins can manage loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Subscribers can view their loyalty points" ON public.loyalty_points;

CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- loyalty_transactions
DROP POLICY IF EXISTS "Admins can manage loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Subscribers can view their loyalty transactions" ON public.loyalty_transactions;

CREATE POLICY "Admins can manage loyalty transactions" ON public.loyalty_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- mac_address_history
DROP POLICY IF EXISTS "Admins can manage MAC history" ON public.mac_address_history;
DROP POLICY IF EXISTS "Technicians can view MAC history" ON public.mac_address_history;

CREATE POLICY "Admins can manage MAC history" ON public.mac_address_history
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view MAC history" ON public.mac_address_history
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'technician'));

-- maintenance_tickets - حذف السياسات المكررة
DROP POLICY IF EXISTS "Accountants can view all tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Admins and technicians can manage tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Agents can update their tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Agents can view their assigned tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Clients can view their own maintenance tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Technicians can view their tickets" ON public.maintenance_tickets;

-- notification_rules
DROP POLICY IF EXISTS "Admins can manage notification rules" ON public.notification_rules;

CREATE POLICY "Admins can manage notification rules" ON public.notification_rules
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications - حذف السياسات المكررة
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- packages - حذف السياسات المكررة
DROP POLICY IF EXISTS "Admins and accountants can view packages" ON public.packages;

-- payments - حذف السياسات المكررة
DROP POLICY IF EXISTS "Accountants can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Clients can view their own payments" ON public.payments;

-- permissions
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Admins can manage permissions" ON public.permissions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view permissions" ON public.permissions
FOR SELECT TO authenticated USING (true);

-- phone_otps
DROP POLICY IF EXISTS "Admins can delete expired OTPs" ON public.phone_otps;
DROP POLICY IF EXISTS "Admins can view all OTPs" ON public.phone_otps;

CREATE POLICY "Admins can manage OTPs" ON public.phone_otps
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pii_access_logs
DROP POLICY IF EXISTS "Admins can view PII access logs" ON public.pii_access_logs;
DROP POLICY IF EXISTS "Prevent PII log deletion" ON public.pii_access_logs;
DROP POLICY IF EXISTS "Prevent PII log updates" ON public.pii_access_logs;

CREATE POLICY "Admins can view PII access logs" ON public.pii_access_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- profiles - حذف السياسة المكررة
DROP POLICY IF EXISTS "Prevent profile deletion" ON public.profiles;

-- promotional_offers
DROP POLICY IF EXISTS "Admins can manage promotional offers" ON public.promotional_offers;
DROP POLICY IF EXISTS "All users can view active offers" ON public.promotional_offers;

CREATE POLICY "Admins can manage promotional offers" ON public.promotional_offers
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active offers" ON public.promotional_offers
FOR SELECT TO authenticated
USING (active = true);

-- referrals
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Subscribers can view their referrals" ON public.referrals;

CREATE POLICY "Admins can manage referrals" ON public.referrals
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- role_permissions
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Auth users can read role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
FOR SELECT TO authenticated USING (true);
