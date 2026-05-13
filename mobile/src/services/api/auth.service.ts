import { supabase } from '../../utils/supabase';
import { apiClient } from './client';
import {
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '../../types/api';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    // 1. Log in via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session || !data.user) throw new Error('Login failed');

    // 2. Sync with backend to get profile
    // We call our backend /auth/me with the Supabase token
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    });

    if (!res.ok) {
      // If profile doesn't exist, we might be in a weird state
      // but we have the auth user at least
      return {
        user: { id: data.user.id, email: data.user.email!, name: '', createdAt: new Date() },
        token: data.session.access_token
      };
    }

    const { user } = await res.json();
    return { user, token: data.session.access_token };
  },

  async signup(data: SignupRequest): Promise<SignupResponse> {
    // We route signup through our backend so it can create the profile table entry
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Signup failed');

    return result;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    apiClient.clearAuthToken();
  },

  async getSessionToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  },

  async forgotPassword(email: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
  }
};
