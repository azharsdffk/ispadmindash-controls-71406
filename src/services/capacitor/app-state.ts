import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

/**
 * مدة الخمول قبل تسجيل الخروج التلقائي (30 دقيقة)
 */
const IDLE_TIMEOUT = 30 * 60 * 1000;

let idleTimer: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();

/**
 * تهيئة مراقبة حالة التطبيق
 */
export const initializeAppState = () => {
  // الاستماع لحالة التطبيق
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active:', isActive);
    
    if (isActive) {
      // التطبيق أصبح نشطاً
      resetIdleTimer();
    } else {
      // التطبيق في الخلفية
      clearIdleTimer();
    }
  });

  // الاستماع لزر الرجوع
  App.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });

  // بدء مراقبة الخمول
  startIdleMonitoring();
};

/**
 * بدء مراقبة الخمول
 */
const startIdleMonitoring = () => {
  // مراقبة نشاط المستخدم
  const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  
  activities.forEach((activity) => {
    document.addEventListener(activity, () => {
      lastActivityTime = Date.now();
      resetIdleTimer();
    });
  });

  resetIdleTimer();
};

/**
 * إعادة تعيين مؤقت الخمول
 */
const resetIdleTimer = () => {
  clearIdleTimer();
  
  idleTimer = setTimeout(async () => {
    const idleDuration = Date.now() - lastActivityTime;
    
    if (idleDuration >= IDLE_TIMEOUT) {
      console.log('User has been idle, logging out...');
      await handleAutoLogout();
    }
  }, IDLE_TIMEOUT);
};

/**
 * إيقاف مؤقت الخمول
 */
const clearIdleTimer = () => {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
};

/**
 * تسجيل خروج تلقائي
 */
const handleAutoLogout = async () => {
  try {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  } catch (error) {
    console.error('Error during auto logout:', error);
  }
};

/**
 * الحصول على معلومات التطبيق
 */
export const getAppInfo = async () => {
  try {
    const info = await App.getInfo();
    return info;
  } catch (error) {
    console.error('Error getting app info:', error);
    return null;
  }
};
