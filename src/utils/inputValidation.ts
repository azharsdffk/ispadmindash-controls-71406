import { z } from 'zod';

/**
 * Phone number validation (Iraqi format)
 */
export const phoneSchema = z.string()
  .regex(/^(\+964|0)?7[3-9]\d{8}$/, 'رقم الهاتف غير صحيح. يجب أن يكون بصيغة عراقية صحيحة')
  .transform(val => val.trim());

/**
 * Email validation
 */
export const emailSchema = z.string()
  .email('البريد الإلكتروني غير صحيح')
  .max(255, 'البريد الإلكتروني طويل جداً')
  .transform(val => val.trim().toLowerCase());

/**
 * Name validation
 */
export const nameSchema = z.string()
  .min(1, 'الاسم مطلوب')
  .max(100, 'الاسم طويل جداً')
  .transform(val => val.trim());

/**
 * Address validation
 */
export const addressSchema = z.string()
  .min(1, 'العنوان مطلوب')
  .max(500, 'العنوان طويل جداً')
  .transform(val => val.trim());

/**
 * Subscriber form validation schema
 */
export const subscriberFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  address: addressSchema.optional().or(z.literal('')),
  plan: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/**
 * Auth validation schemas
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل'),
  fullName: nameSchema,
  phone: phoneSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat?: number, lng?: number): boolean {
  if (lat !== undefined && (lat < -90 || lat > 90)) return false;
  if (lng !== undefined && (lng < -180 || lng > 180)) return false;
  return true;
}