-- تفعيل extensions للجدولة
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- إنشاء جدولة يومية لفحص الإشعارات (كل يوم الساعة 9 صباحاً)
SELECT cron.schedule(
  'check-daily-notifications',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
        url:='${SUPABASE_URL}/functions/v1/check-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- إنشاء جدولة لتحديث حالة العقود المنتهية (كل يوم الساعة 1 صباحاً)
SELECT cron.schedule(
  'update-expired-contracts',
  '0 1 * * *',
  $$
  SELECT check_expired_contracts();
  $$
);