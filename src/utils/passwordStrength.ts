export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordValidation {
  strength: PasswordStrength;
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let strength: PasswordStrength = 'weak';

  // Check minimum length
  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
  }

  // Calculate strength
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const criteriaCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (criteriaCount >= 5) {
    strength = 'strong';
  } else if (criteriaCount >= 3) {
    strength = 'medium';
  }

  return {
    strength,
    isValid: errors.length === 0,
    errors
  };
};

export const getStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'bg-destructive';
    case 'medium':
      return 'bg-warning';
    case 'strong':
      return 'bg-success';
  }
};

export const getStrengthText = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'ضعيفة';
    case 'medium':
      return 'متوسطة';
    case 'strong':
      return 'قوية';
  }
};

/**
 * Check if password has been leaked using HaveIBeenPwned API (k-anonymity method)
 * This method is secure and doesn't send the full password to the API
 */
export const checkPasswordLeaked = async (password: string): Promise<{ isLeaked: boolean; count: number }> => {
  try {
    // Create SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Get first 5 characters (prefix) and the rest (suffix)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    // Query HaveIBeenPwned API with k-anonymity
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true' // Add padding to prevent timing attacks
      }
    });
    
    if (!response.ok) {
      console.warn('Failed to check password against breach database');
      return { isLeaked: false, count: 0 };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our suffix is in the returned list
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { isLeaked: true, count: parseInt(count.trim(), 10) };
      }
    }
    
    return { isLeaked: false, count: 0 };
  } catch (error) {
    console.error('Error checking password breach:', error);
    return { isLeaked: false, count: 0 };
  }
};
