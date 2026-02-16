// Authentication Context for Mobile

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@auth_user');
      const storedToken = await AsyncStorage.getItem('@auth_token');
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
      await AsyncStorage.setItem('@auth_user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@auth_token', response.token);
      apiClient.setAuthToken(response.token);
      setUser(response.user);
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Logged in as ${response.user.email}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: 'Invalid email or password',
      });
      throw error;
    }
  };

  const signup = async (data: SignupRequest) => {
    try {
      const response = await authService.signup(data);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@auth_token', response.token);
      apiClient.setAuthToken(response.token);
      setUser(response.user);
      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: 'Welcome to BHAO.PK',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2: 'Please try again',
      });
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@auth_user');
    await AsyncStorage.removeItem('@auth_token');
    apiClient.clearAuthToken();
    setUser(null);
    Toast.show({
      type: 'info',
      text1: 'Logged out',
      text2: 'See you soon!',
    });
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
      Toast.show({
        type: 'success',
        text1: 'Email sent!',
        text2: 'Check your inbox for reset instructions',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send email',
        text2: 'Please try again',
      });
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
