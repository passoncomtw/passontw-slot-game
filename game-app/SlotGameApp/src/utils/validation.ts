/**
 * 驗證工具函數
 */

// 驗證電子郵件
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 驗證密碼長度
export const validatePasswordLength = (password: string): boolean => {
  return password.length >= 8;
};

// 驗證密碼複雜度 (至少包含一個大寫字母、一個小寫字母和一個數字)
export const validatePasswordComplexity = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
};

// 驗證密碼是否一致
export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// 驗證用戶名長度
export const validateUsernameLength = (username: string): boolean => {
  return username.length >= 3 && username.length <= 20;
};

// 驗證用戶名格式 (只包含字母、數字和下劃線)
export const validateUsernameFormat = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};

// 合併驗證密碼，返回錯誤消息或 null
export const validatePassword = (password: string): string | null => {
  if (!validatePasswordLength(password)) {
    return '密碼長度至少為 8 個字符';
  }
  
  if (!validatePasswordComplexity(password)) {
    return '密碼必須包含至少一個大寫字母、一個小寫字母和一個數字';
  }
  
  return null;
};

// 合併驗證用戶名，返回錯誤消息或 null
export const validateUsername = (username: string): string | null => {
  if (!validateUsernameLength(username)) {
    return '用戶名長度應在 3-20 個字符之間';
  }
  
  if (!validateUsernameFormat(username)) {
    return '用戶名只能包含字母、數字和下劃線';
  }
  
  return null;
}; 