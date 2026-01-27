import { supabase } from "@/integrations/supabase/client";

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface LoggedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  url: string;
  timestamp: string;
  userAgent: string;
}

// قائمة الأخطاء المسجلة محلياً (للتجميع قبل الإرسال)
const errorQueue: LoggedError[] = [];
const MAX_QUEUE_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 ثانية

/**
 * تسجيل خطأ في النظام
 */
export const logError = (
  error: Error | string,
  context: ErrorContext = {}
): void => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  const logEntry: LoggedError = {
    message: errorObj.message,
    stack: errorObj.stack,
    context,
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };

  // طباعة في الـ console للتطوير
  console.error('[App Error]', logEntry);

  // إضافة للقائمة
  errorQueue.push(logEntry);

  // إرسال إذا وصلنا للحد الأقصى
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    flushErrors();
  }
};

/**
 * إرسال الأخطاء المجمعة للخادم
 */
export const flushErrors = async (): Promise<void> => {
  if (errorQueue.length === 0) return;

  const errorsToSend = [...errorQueue];
  errorQueue.length = 0;

  try {
    // تسجيل في audit_logs كـ batch
    const { error } = await supabase.from('audit_logs').insert(
      errorsToSend.map(err => ({
        action: 'ERROR',
        table_name: 'client_errors',
        new_data: {
          message: err.message,
          stack: err.stack?.substring(0, 500) || null,
          component: err.context.component || null,
          contextAction: err.context.action || null,
          url: err.url,
          timestamp: err.timestamp
        }
      }))
    );

    if (error) {
      console.warn('Failed to send error logs:', error);
      // إعادة الأخطاء للقائمة
      errorQueue.push(...errorsToSend);
    }
  } catch (e) {
    console.warn('Error logging failed:', e);
  }
};

/**
 * تسجيل تحذير
 */
export const logWarning = (
  message: string,
  context: ErrorContext = {}
): void => {
  console.warn('[App Warning]', { message, context });
};

/**
 * تسجيل معلومات للتتبع
 */
export const logInfo = (
  message: string,
  data?: Record<string, any>
): void => {
  if (import.meta.env.DEV) {
    console.info('[App Info]', message, data);
  }
};

/**
 * تسجيل أداء عملية
 */
export const logPerformance = (
  operationName: string,
  durationMs: number,
  metadata?: Record<string, any>
): void => {
  if (durationMs > 1000) {
    console.warn('[Slow Operation]', {
      operation: operationName,
      duration: `${durationMs}ms`,
      ...metadata
    });
  }
};

/**
 * قياس وقت تنفيذ function
 */
export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logPerformance(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logError(error as Error, { 
      action: name, 
      metadata: { durationMs: duration } 
    });
    throw error;
  }
};

/**
 * Global error handler
 */
export const setupGlobalErrorHandler = (): void => {
  if (typeof window === 'undefined') return;

  // Uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    logError(error || String(message), {
      component: 'global',
      metadata: { source, lineno, colno }
    });
    return false;
  };

  // Unhandled promise rejections
  window.onunhandledrejection = (event) => {
    logError(event.reason || 'Unhandled Promise Rejection', {
      component: 'global',
      action: 'unhandledrejection'
    });
  };

  // Flush errors periodically
  setInterval(flushErrors, FLUSH_INTERVAL);

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushErrors();
  });
};

export default {
  logError,
  logWarning,
  logInfo,
  logPerformance,
  measureAsync,
  flushErrors,
  setupGlobalErrorHandler
};
