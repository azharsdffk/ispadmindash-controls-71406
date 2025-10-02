import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

/**
 * تخزين آمن للـ Tokens باستخدام Keychain (iOS) و Keystore (Android)
 */
export const secureStorage = {
  /**
   * حفظ Access Token
   */
  setAccessToken: async (token: string) => {
    await SecureStoragePlugin.set({
      key: 'access_token',
      value: token
    });
  },

  /**
   * الحصول على Access Token
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      const { value } = await SecureStoragePlugin.get({ key: 'access_token' });
      return value;
    } catch {
      return null;
    }
  },

  /**
   * حفظ Refresh Token
   */
  setRefreshToken: async (token: string) => {
    await SecureStoragePlugin.set({
      key: 'refresh_token',
      value: token
    });
  },

  /**
   * الحصول على Refresh Token
   */
  getRefreshToken: async (): Promise<string | null> => {
    try {
      const { value } = await SecureStoragePlugin.get({ key: 'refresh_token' });
      return value;
    } catch {
      return null;
    }
  },

  /**
   * حذف جميع الـ Tokens
   */
  clearTokens: async () => {
    await SecureStoragePlugin.remove({ key: 'access_token' });
    await SecureStoragePlugin.remove({ key: 'refresh_token' });
  },

  /**
   * حفظ بيانات المستخدم
   */
  setUserData: async (userData: any) => {
    await SecureStoragePlugin.set({
      key: 'user_data',
      value: JSON.stringify(userData)
    });
  },

  /**
   * الحصول على بيانات المستخدم
   */
  getUserData: async (): Promise<any | null> => {
    try {
      const { value } = await SecureStoragePlugin.get({ key: 'user_data' });
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  /**
   * حذف جميع البيانات
   */
  clearAll: async () => {
    await SecureStoragePlugin.clear();
  }
};
