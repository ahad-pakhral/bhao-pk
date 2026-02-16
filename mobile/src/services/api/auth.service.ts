// Authentication service

import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../../types/api';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    } as LoginRequest);
    return response;
  },

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await apiClient.post<SignupResponse>('/auth/signup', data);
    return response;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { email } as ForgotPasswordRequest
    );
    return response;
  },

  async resetPassword(
    token: string,
    password: string
  ): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>(
      '/auth/reset-password',
      { token, password } as ResetPasswordRequest
    );
    return response;
  },

  async logout(): Promise<void> {
    apiClient.clearAuthToken();
  },
};
