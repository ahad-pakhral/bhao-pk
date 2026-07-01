import { create } from 'zustand';
import { supabase } from '../utils/supabase';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; name: string }) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    logout: async () => {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sb-token');
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },

    login: async (email, password) => {
        // 1. Log in via Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!data.session || !data.user) throw new Error('Login failed');

        // 2. Fetch our custom profile from our backend
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${data.session.access_token}` }
        });
        
        if (res.ok) {
            const { user } = await res.json();
            if (typeof window !== 'undefined') {
                localStorage.setItem('sb-token', data.session.access_token);
            }
            set({ 
                user, 
                token: data.session.access_token, 
                isAuthenticated: true, 
                isLoading: false 
            });
        } else {
            // Fallback if profile doesn't exist yet but auth does
            if (typeof window !== 'undefined') {
                localStorage.setItem('sb-token', data.session.access_token);
            }
            set({ 
                user: { id: data.user.id, email: data.user.email!, name: '', role: 'USER' }, 
                token: data.session.access_token, 
                isAuthenticated: true, 
                isLoading: false 
            });
        }
    },

    register: async ({ email, password, name }) => {
        // 1. Register with Supabase
        // Note: we can also call our backend register which does both
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        // Supabase register might return session if email confirmation is off
        if (data.session) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('sb-token', data.session.access_token);
            }
            set({ 
                user: data.user, 
                token: data.session.access_token, 
                isAuthenticated: true, 
                isLoading: false 
            });
        } else {
            // Probably needs email confirmation
            set({ isLoading: false });
        }
    },

    checkSession: async () => {
        try {
            // 1. Get current session from Supabase client (handles tokens/refresh)
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('sb-token');
                }
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                return;
            }

            // 2. Sync with our backend to get the profile
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                const { user } = await res.json();
                if (typeof window !== 'undefined') {
                    localStorage.setItem('sb-token', session.access_token);
                }
                set({
                    user,
                    token: session.access_token,
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                // If backend check fails, assume session is invalid
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('sb-token');
                }
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            }
        } catch (err) {
            console.error('Session check failed', err);
            set({ isLoading: false });
        }
    },

    forgotPassword: async (email) => {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
    }
}));
