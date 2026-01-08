
-- =====================================================
-- إصلاح باقي سياسات RLS - الجزء الثالث
-- =====================================================

-- schedule - حذف السياسات المكررة
DROP POLICY IF EXISTS "Users can update their assigned tasks" ON public.schedule;
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.schedule;

-- security_audit_logs
DROP POLICY IF EXISTS "Admins can view all security audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Prevent security audit log deletion" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Prevent security audit log updates" ON public.security_audit_logs;

CREATE POLICY "Admins can view all security audit logs" ON public.security_audit_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- sms_logs - حذف السياسة المكررة
DROP POLICY IF EXISTS "Staff can update SMS logs" ON public.sms_logs;

-- sms_settings
DROP POLICY IF EXISTS "Admins can manage SMS settings" ON public.sms_settings;
CREATE POLICY "Admins can manage SMS settings" ON public.sms_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sms_templates
DROP POLICY IF EXISTS "Admins can manage SMS templates" ON public.sms_templates;
CREATE POLICY "Admins can manage SMS templates" ON public.sms_templates
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subscriber_audit_trail
DROP POLICY IF EXISTS "Admins can view all audit trails" ON public.subscriber_audit_trail;
DROP POLICY IF EXISTS "Prevent audit trail deletion" ON public.subscriber_audit_trail;
DROP POLICY IF EXISTS "Prevent audit trail updates" ON public.subscriber_audit_trail;

CREATE POLICY "Admins can view all audit trails" ON public.subscriber_audit_trail
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- subscriber_users
DROP POLICY IF EXISTS "Admins can manage subscriber links" ON public.subscriber_users;
DROP POLICY IF EXISTS "Only admins can delete subscriber links" ON public.subscriber_users;
DROP POLICY IF EXISTS "Only admins can update subscriber links" ON public.subscriber_users;
DROP POLICY IF EXISTS "Users can view own subscriber link" ON public.subscriber_users;

CREATE POLICY "Admins can manage subscriber links" ON public.subscriber_users
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own subscriber link" ON public.subscriber_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- subscribers - حذف السياسات المكررة
DROP POLICY IF EXISTS "Accountants can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Accountants can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Clients can search subscribers to link account" ON public.subscribers;
DROP POLICY IF EXISTS "Clients can view their own subscriber data" ON public.subscribers;
DROP POLICY IF EXISTS "Only admins can delete subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Technicians can view all subscribers" ON public.subscribers;

-- technician_locations
DROP POLICY IF EXISTS "Admins can manage all technician locations" ON public.technician_locations;
DROP POLICY IF EXISTS "Auth clients can view assigned tech location" ON public.technician_locations;
DROP POLICY IF EXISTS "Auth technicians can manage own location" ON public.technician_locations;
DROP POLICY IF EXISTS "Clients can view assigned technician location" ON public.technician_locations;
DROP POLICY IF EXISTS "Technicians can manage their own location" ON public.technician_locations;

CREATE POLICY "Admins can manage all technician locations" ON public.technician_locations
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can manage own location" ON public.technician_locations
FOR ALL TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- technician_ratings
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.technician_ratings;
DROP POLICY IF EXISTS "Auth technicians can view own ratings" ON public.technician_ratings;
DROP POLICY IF EXISTS "Technicians can view their own ratings" ON public.technician_ratings;

CREATE POLICY "Admins can manage all ratings" ON public.technician_ratings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view own ratings" ON public.technician_ratings
FOR SELECT TO authenticated
USING (technician_id = auth.uid());

-- technician_stats
DROP POLICY IF EXISTS "Admin manage tech stats" ON public.technician_stats;
DROP POLICY IF EXISTS "Admins can manage all stats" ON public.technician_stats;
DROP POLICY IF EXISTS "Auth technicians can view own stats" ON public.technician_stats;
DROP POLICY IF EXISTS "Technicians can view their own stats" ON public.technician_stats;

CREATE POLICY "Admins can manage all stats" ON public.technician_stats
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view own stats" ON public.technician_stats
FOR SELECT TO authenticated
USING (technician_id = auth.uid());

-- technicians - حذف السياسات المكررة
DROP POLICY IF EXISTS "Admins can view all technicians" ON public.technicians;
DROP POLICY IF EXISTS "Auth technicians can view own data" ON public.technicians;
DROP POLICY IF EXISTS "Only admins can view full technician details" ON public.technicians;
DROP POLICY IF EXISTS "Technicians can view own data" ON public.technicians;
DROP POLICY IF EXISTS "Technicians can view their own data" ON public.technicians;

-- ticket_events
DROP POLICY IF EXISTS "Admins can manage all ticket events" ON public.ticket_events;
DROP POLICY IF EXISTS "Clients can view their ticket events" ON public.ticket_events;
DROP POLICY IF EXISTS "Technicians can view events for their tickets" ON public.ticket_events;

CREATE POLICY "Admins can manage all ticket events" ON public.ticket_events
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view ticket events" ON public.ticket_events
FOR SELECT TO authenticated USING (true);

-- user_dashboard_layout
DROP POLICY IF EXISTS "Users can update their own dashboard layout" ON public.user_dashboard_layout;
DROP POLICY IF EXISTS "Users can view their own dashboard layout" ON public.user_dashboard_layout;

CREATE POLICY "Users can manage own dashboard layout" ON public.user_dashboard_layout
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- user_roles - حذف السياسات المكررة
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- user_security_settings
DROP POLICY IF EXISTS "Admins can view all security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security_settings;

CREATE POLICY "Admins can view all security settings" ON public.user_security_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own security settings" ON public.user_security_settings
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- visit_logs
DROP POLICY IF EXISTS "Admins can manage all visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Auth clients can view visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Auth technicians can manage visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Clients can rate their visits" ON public.visit_logs;
DROP POLICY IF EXISTS "Clients can view their visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Technicians can manage their visit logs" ON public.visit_logs;

CREATE POLICY "Admins can manage all visit logs" ON public.visit_logs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can manage visit logs" ON public.visit_logs
FOR ALL TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- vouchers
DROP POLICY IF EXISTS "Accountants can view all vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins and accountants can manage vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins can view all vouchers" ON public.vouchers;

CREATE POLICY "Admins and accountants can manage vouchers" ON public.vouchers
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- work_logs
DROP POLICY IF EXISTS "Admins can manage all work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Auth technicians can manage work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Auth technicians can view work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Technicians can update work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Technicians can view work logs" ON public.work_logs;

CREATE POLICY "Admins can manage all work logs" ON public.work_logs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can manage work logs" ON public.work_logs
FOR ALL TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- work_photos
DROP POLICY IF EXISTS "Admins can manage all work photos" ON public.work_photos;
DROP POLICY IF EXISTS "Auth technicians can view work photos" ON public.work_photos;
DROP POLICY IF EXISTS "Technicians can view work photos" ON public.work_photos;

CREATE POLICY "Admins can manage all work photos" ON public.work_photos
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view work photos" ON public.work_photos
FOR SELECT TO authenticated USING (true);

-- work_reports
DROP POLICY IF EXISTS "Admins can manage all work reports" ON public.work_reports;
DROP POLICY IF EXISTS "Auth technicians can manage own reports" ON public.work_reports;
DROP POLICY IF EXISTS "Technicians can manage their own reports" ON public.work_reports;

CREATE POLICY "Admins can manage all work reports" ON public.work_reports
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can manage own reports" ON public.work_reports
FOR ALL TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- invoices - حذف السياسة المكررة
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

-- payments - حذف السياسة المكررة
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

-- audit_logs - حذف السياسات القديمة
DROP POLICY IF EXISTS "Prevent audit log deletion" ON public.audit_logs;
DROP POLICY IF EXISTS "Prevent audit log updates" ON public.audit_logs;
