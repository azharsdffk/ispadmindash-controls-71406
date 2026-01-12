-- إضافة عمود user_id لجدول الفنيين لربطهم بحسابات المستخدمين
ALTER TABLE public.technicians 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON public.technicians(user_id);

-- تحديث سياسة RLS للسماح للفنيين برؤية بياناتهم
CREATE POLICY "Technicians can view their own data" 
ON public.technicians 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));