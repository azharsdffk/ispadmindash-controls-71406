-- إضافة دور الوكيل (agent) للنظام
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';