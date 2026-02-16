'use client';

// Authentication Context for Webapp

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, apiClient } from '../services/api';
import { User } from '../types/models';
import { SignupRequest } from '../types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = () => {
    try {
      const storedUser = localStorage.getItem('@auth_user');
      const storedToken = localStorage.getItem('@auth_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        apiClient.setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('@auth_user', JSON.stringify(response.user));
      localStorage.setItem('@auth_token', response.token);
      apiClient.setAuthToken(response.token);
      setUser(response.user);
      // Toast notification would go here
      console.log('Login successful:', response.user.email);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: SignupRequest) => {
    try {
      const response = await authService.signup(data);
      localStorage.setItem('@auth_user', JSON.stringify(response.user));
      localStorage.setItem('@auth_token', response.token);
      apiClient.setAuthToken(response.token);
      setUser(response.user);
      console.log('Signup successful');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('@auth_user');
    localStorage.removeItem('@auth_token');
    apiClient.clearAuthToken();
    setUser(null);
    console.log('Logged out');
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      throw error;
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
