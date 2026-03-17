export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => ValidationResult;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate email with detailed error message
 */
export const validateEmailDetailed = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email không được để trống' };
  }
  
  if (!validateEmail(email)) {
    return { isValid: false, error: 'Email không hợp lệ' };
  }
  
  return { isValid: true };
};

/**
 * Validate password (minimum 6 characters)
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate password with detailed error message
 */
export const validatePasswordDetailed = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Mật khẩu không được để trống' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  
  if (password.length > 100) {
    return { isValid: false, error: 'Mật khẩu không được quá 100 ký tự' };
  }
  
  return { isValid: true };
};

/**
 * Validate strong password (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export const validateStrongPassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Mật khẩu không được để trống' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 chữ hoa' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 chữ thường' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 chữ số' };
  }
  
  return { isValid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Mật khẩu xác nhận không khớp' };
  }
  
  return { isValid: true };
};

/**
 * Validate username (3-20 chars, alphanumeric and underscore only)
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Username không được để trống' };
  }
  
  const trimmedUsername = username.trim();
  
  if (trimmedUsername.length < 3) {
    return { isValid: false, error: 'Username phải có ít nhất 3 ký tự' };
  }
  
  if (trimmedUsername.length > 20) {
    return { isValid: false, error: 'Username không được quá 20 ký tự' };
  }
  
  // Only alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới' };
  }
  
  // Cannot start with number
  if (/^\d/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username không được bắt đầu bằng số' };
  }
  
  return { isValid: true };
};

/**
 * Validate name (2-100 characters)
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Tên không được để trống' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Tên phải có ít nhất 2 ký tự' };
  }
  
  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Tên không được quá 100 ký tự' };
  }
  
  // Check for invalid characters (only letters, spaces, and Vietnamese characters)
  if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Tên chỉ được chứa chữ cái và khoảng trắng' };
  }
  
  return { isValid: true };
};

/**
 * Validate phone number (Vietnamese format)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Số điện thoại không được để trống' };
  }
  
  // Vietnamese phone number: 10 digits, starts with 0
  const phoneRegex = /^0[0-9]{9}$/;
  
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)' };
  }
  
  return { isValid: true };
};

/**
 * Validate OTP code (6 digits)
 */
export const validateOTP = (otp: string): ValidationResult => {
  if (!otp || otp.trim() === '') {
    return { isValid: false, error: 'Mã OTP không được để trống' };
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, error: 'Mã OTP phải là 6 chữ số' };
  }
  
  return { isValid: true };
};

/**
 * Generic field validator
 */
export const validateField = (value: string, rules: ValidationRules): ValidationResult => {
  // Required check
  if (rules.required && (!value || value.trim() === '')) {
    return { isValid: false, error: 'Trường này không được để trống' };
  }
  
  // Skip other validations if empty and not required
  if (!value || value.trim() === '') {
    return { isValid: true };
  }
  
  // Min length check
  if (rules.minLength && value.length < rules.minLength) {
    return { isValid: false, error: `Phải có ít nhất ${rules.minLength} ký tự` };
  }
  
  // Max length check
  if (rules.maxLength && value.length > rules.maxLength) {
    return { isValid: false, error: `Không được quá ${rules.maxLength} ký tự` };
  }
  
  // Pattern check
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: 'Định dạng không hợp lệ' };
  }
  
  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }
  
  return { isValid: true };
};

/**
 * Validate multiple fields at once
 */
export const validateForm = (fields: { [key: string]: { value: string; rules: ValidationRules } }): {
  isValid: boolean;
  errors: { [key: string]: string };
} => {
  const errors: { [key: string]: string } = {};
  let isValid = true;
  
  Object.keys(fields).forEach((fieldName) => {
    const { value, rules } = fields[fieldName];
    const result = validateField(value, rules);
    
    if (!result.isValid) {
      errors[fieldName] = result.error || 'Không hợp lệ';
      isValid = false;
    }
  });
  
  return { isValid, errors };
};
