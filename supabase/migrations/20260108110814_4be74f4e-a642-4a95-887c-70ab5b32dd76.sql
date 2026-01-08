-- =====================================================
-- إصلاح السياسات المتبقية - الإصدار النهائي
-- =====================================================

-- technicians
DROP POLICY IF EXISTS "Auth technicians can view own data" ON public.technicians;
CREATE POLICY "Auth technicians can view own data"
ON public.technicians FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- technician_ratings
DROP POLICY IF EXISTS "Auth technicians can view own ratings" ON public.technician_ratings;
CREATE POLICY "Auth technicians can view own ratings"
ON public.technician_ratings FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_ratings.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- technician_stats
DROP POLICY IF EXISTS "Auth technicians can view own stats" ON public.technician_stats;
CREATE POLICY "Auth technicians can view own stats"
ON public.technician_stats FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_stats.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- work_logs
DROP POLICY IF EXISTS "Auth technicians can view work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Auth technicians can manage work logs" ON public.work_logs;
CREATE POLICY "Auth technicians can view work logs"
ON public.work_logs FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = work_logs.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Auth technicians can manage work logs"
ON public.work_logs FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = work_logs.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = work_logs.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- work_photos
DROP POLICY IF EXISTS "Auth technicians can view work photos" ON public.work_photos;
CREATE POLICY "Auth technicians can view work photos"
ON public.work_photos FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = work_photos.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- work_reports
DROP POLICY IF EXISTS "Auth technicians can manage own reports" ON public.work_reports;
CREATE POLICY "Auth technicians can manage own reports"
ON public.work_reports FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = work_reports.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = work_reports.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- visit_logs
DROP POLICY IF EXISTS "Auth clients can view visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Auth technicians can manage visit logs" ON public.visit_logs;
CREATE POLICY "Auth clients can view visit logs"
ON public.visit_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets mt 
    JOIN subscriber_users su ON mt.subscriber_id = su.subscriber_id
    WHERE mt.id = visit_logs.ticket_id AND su.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = visit_logs.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Auth technicians can manage visit logs"
ON public.visit_logs FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = visit_logs.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = visit_logs.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- technician_locations - استخدام القيم الصحيحة لـ ticket_status
DROP POLICY IF EXISTS "Auth technicians can manage own location" ON public.technician_locations;
DROP POLICY IF EXISTS "Auth clients can view assigned tech location" ON public.technician_locations;
CREATE POLICY "Auth technicians can manage own location"
ON public.technician_locations FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_locations.technician_id AND t.id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_locations.technician_id AND t.id = auth.uid())
);
CREATE POLICY "Auth clients can view assigned tech location"
ON public.technician_locations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets mt
    JOIN subscriber_users su ON mt.subscriber_id = su.subscriber_id
    WHERE mt.technician_id = technician_locations.technician_id
    AND su.user_id = auth.uid()
    AND mt.status IN ('in_progress', 'tech_on_the_way', 'tech_arrived')
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- role_permissions
CREATE POLICY "Auth users can read role permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);