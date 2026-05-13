import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { authService, apiClient } from '../services/api';
import { User } from '../types/models';
import { SignupRequest } from '../types/api';
import Toast from 'react-native-toast-message';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateLocalUser: (patch: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session and listen for changes
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        syncProfile(session.access_token);
      } else {
        setUser(null);
        apiClient.clearAuthToken();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncProfile(session.access_token);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncProfile = async (token: string) => {
    try {
      apiClient.setAuthToken(token);
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { user } = await res.json();
        setUser(user);
      }
    } catch (err) {
      console.error('Sync profile failed:', err);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      setUser(response.user);
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Logged in as ${response.user.email}`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error.message || 'Invalid email or password',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.signup(data);
      if (response.user && response.token) {
        setUser(response.user);
        apiClient.setAuthToken(response.token);
        Toast.show({
          type: 'success',
          text1: 'Account created!',
          text2: 'Welcome to BHAO.PK',
        });
      } else {
        // Email confirmation required — session will be null
        Toast.show({
          type: 'info',
          text1: 'Check your email',
          text2: 'We sent a verification link to your email address',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    Toast.show({
      type: 'info',
      text1: 'Logged out',
      text2: 'See you soon!',
    });
  };

  const forgotPassword = async (email: string) => {
    await authService.forgotPassword(email);
    Toast.show({
      type: 'success',
      text1: 'Check your email',
      text2: 'Password reset link sent if account exists',
    });
  };

  const updateLocalUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await syncProfile(session.access_token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        forgotPassword,
        updateLocalUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
