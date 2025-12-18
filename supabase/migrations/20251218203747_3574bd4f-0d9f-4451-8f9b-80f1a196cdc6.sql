-- إصلاح سياسات RLS للمشتركين - السماح للفنيين برؤية كل المشتركين
DROP POLICY IF EXISTS "Technicians can view assigned subscribers only" ON public.subscribers;

-- سياسة جديدة للفنيين - رؤية كل المشتركين
CREATE POLICY "Technicians can view all subscribers"
ON public.subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'technician'::app_role));

-- إصلاح سياسة الوصول العامة لتكون RESTRICTIVE بدلاً من PERMISSIVE
DROP POLICY IF EXISTS "Require valid role for subscriber access" ON public.subscribers;

-- تحسين سياسات maintenance_tickets للفنيين
DROP POLICY IF EXISTS "Technicians can view assigned tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Technicians can update assigned tickets" ON public.maintenance_tickets;

-- السماح للفنيين برؤية التذاكر المسندة إليهم
CREATE POLICY "Technicians can view assigned tickets"
ON public.maintenance_tickets
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role) OR
  (has_role(auth.uid(), 'technician'::app_role) AND technician_id = auth.uid())
);

-- السماح للفنيين بتحديث التذاكر المسندة إليهم
CREATE POLICY "Technicians can update assigned tickets"
ON public.maintenance_tickets
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'technician'::app_role) AND technician_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'technician'::app_role) AND technician_id = auth.uid())
);

-- تحسين سياسات work_logs
DROP POLICY IF EXISTS "Technicians can view their own work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Technicians can insert their own work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Technicians can update their own work logs" ON public.work_logs;

CREATE POLICY "Technicians can view work logs"
ON public.work_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  technician_id = auth.uid()
);

CREATE POLICY "Technicians can insert work logs"
ON public.work_logs
FOR INSERT
TO authenticated
WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Technicians can update work logs"
ON public.work_logs
FOR UPDATE
TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- تحسين سياسات work_photos
DROP POLICY IF EXISTS "Technicians can view their own work photos" ON public.work_photos;
DROP POLICY IF EXISTS "Technicians can insert their own work photos" ON public.work_photos;

CREATE POLICY "Technicians can view work photos"
ON public.work_photos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  technician_id = auth.uid()
);

CREATE POLICY "Technicians can insert work photos"
ON public.work_photos
FOR INSERT
TO authenticated
WITH CHECK (technician_id = auth.uid());