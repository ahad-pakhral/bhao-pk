export interface PasswordRule {
  label: string;
  met: boolean;
}

export interface PasswordValidation {
  isValid: boolean;
  rules: PasswordRule[];
}

export function validatePassword(password: string): PasswordValidation {
  const rules: PasswordRule[] = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: '1 lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: '1 uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: '1 special character (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  return {
    isValid: rules.every((r) => r.met),
    rules,
  };
}
