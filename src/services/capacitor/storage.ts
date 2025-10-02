import { Preferences } from '@capacitor/preferences';

/**
 * تخزين آمن للـ Tokens
 */
export const secureStorage = {
  /**
   * حفظ Access Token
   */
  setAccessToken: async (token: string) => {
    await Preferences.set({
      key: 'access_token',
      value: token
    });
  },

  /**
   * الحصول على Access Token
   */
  getAccessToken: async (): Promise<string | null> => {
    const { value } = await Preferences.get({ key: 'access_token' });
    return value;
  },

  /**
   * حفظ Refresh Token
   */
  setRefreshToken: async (token: string) => {
    await Preferences.set({
      key: 'refresh_token',
      value: token
    });
  },

  /**
   * الحصول على Refresh Token
   */
  getRefreshToken: async (): Promise<string | null> => {
    const { value } = await Preferences.get({ key: 'refresh_token' });
    return value;
  },

  /**
   * حذف جميع الـ Tokens
   */
  clearTokens: async () => {
    await Preferences.remove({ key: 'access_token' });
    await Preferences.remove({ key: 'refresh_token' });
  },

  /**
   * حفظ بيانات المستخدم
   */
  setUserData: async (userData: any) => {
    await Preferences.set({
      key: 'user_data',
      value: JSON.stringify(userData)
    });
  },

  /**
   * الحصول على بيانات المستخدم
   */
  getUserData: async (): Promise<any | null> => {
    const { value } = await Preferences.get({ key: 'user_data' });
    return value ? JSON.parse(value) : null;
  },

  /**
   * حذف جميع البيانات
   */
  clearAll: async () => {
    await Preferences.clear();
  }
};
