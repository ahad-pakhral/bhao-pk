// Form validation utility

export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean;
  message: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export const validators = {
  required: (message: string = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    },
    message,
  }),

  email: (message: string = 'Invalid email address'): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= length,
    message: message || `Minimum ${length} characters required`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= length,
    message: message || `Maximum ${length} characters allowed`,
  }),

  password: (
    message: string = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
  ): ValidationRule => ({
    validate: (value: string) => {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return passwordRegex.test(value);
    },
    message,
  }),

  match: (fieldName: string, message?: string): ValidationRule => ({
    validate: (value: string, formData: any) => {
      return value === formData[fieldName];
    },
    message: message || `Must match ${fieldName}`,
  }),

  numeric: (message: string = 'Must be a number'): ValidationRule => ({
    validate: (value: any) => !isNaN(Number(value)),
    message,
  }),

  price: (message: string = 'Invalid price format'): ValidationRule => ({
    validate: (value: any) => {
      const priceRegex = /^\d+(\.\d{1,2})?$/;
      return priceRegex.test(value.toString());
    },
    message,
  }),

  positive: (message: string = 'Must be a positive number'): ValidationRule => ({
    validate: (value: any) => Number(value) > 0,
    message,
  }),
};

export function validateField(
  value: any,
  rules: ValidationRule[],
  formData?: any
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value, formData)) {
      return rule.message;
    }
  }
  return null;
}

export function validateForm(
  formData: Record<string, any>,
  schema: ValidationSchema
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(formData[field], rules, formData);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

// Pre-defined schemas
export const loginSchema: ValidationSchema = {
  email: [validators.required('Email is required'), validators.email()],
  password: [validators.required('Password is required')],
};

export const signupSchema: ValidationSchema = {
  name: [
    validators.required('Name is required'),
    validators.minLength(2, 'Name must be at least 2 characters'),
  ],
  email: [validators.required('Email is required'), validators.email()],
  password: [validators.required('Password is required'), validators.password()],
  confirmPassword: [
    validators.required('Please confirm password'),
    validators.match('password', 'Passwords do not match'),
  ],
};

export const forgotPasswordSchema: ValidationSchema = {
  email: [validators.required('Email is required'), validators.email()],
};

export const priceAlertSchema: ValidationSchema = {
  targetPrice: [
    validators.required('Target price is required'),
    validators.numeric(),
    validators.positive('Price must be positive'),
  ],
};
