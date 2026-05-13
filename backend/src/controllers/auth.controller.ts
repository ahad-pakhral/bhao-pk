import { Request, Response } from 'express';
import { db } from '../services/db.service';
import { supabase } from '../services/supabase.service';

function validatePasswordStrength(password: string): string | null {
    const errors: string[] = [];
    if (password.length < 6) errors.push('At least 6 characters');
    if (!/[a-z]/.test(password)) errors.push('1 lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('1 uppercase letter');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('1 special character');
    return errors.length > 0 ? `Password must have: ${errors.join(', ')}` : null;
}

/**
 * Register a new user with Supabase Auth
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        if (!authData.user) {
            return res.status(400).json({ error: 'Sign up failed' });
        }

        // 2. Create the user profile in Supabase DB
        const { data: user, error: dbError } = await db.createUser(
            authData.user.id,
            authData.user.email!,
            name,
        );

        if (dbError) {
            console.error('Profile creation error:', dbError);
            // Auth succeeded but profile failed — return basic user data
            return res.status(201).json({
                user: { id: authData.user.id, email: authData.user.email, name, role: 'USER' },
                token: authData.session?.access_token,
                session: authData.session,
            });
        }

        res.status(201).json({
            user,
            token: authData.session?.access_token,
            session: authData.session,
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

/**
 * Log in with Supabase Auth
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        if (!data.user || !data.session) {
            return res.status(401).json({ error: 'Login failed' });
        }

        // Fetch or create profile from Supabase DB
        let { data: user } = await db.findUser(data.user.id);

        if (!user) {
            // Auto-create profile if it doesn't exist
            const { data: newUser } = await db.createUser(
                data.user.id,
                data.user.email!,
                data.user.user_metadata?.name || '',
            );
            user = newUser || { id: data.user.id, email: data.user.email, name: '', role: 'USER' };
        }

        res.json({
            user,
            token: data.session.access_token,
            session: data.session,
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Get current user profile (using token decoded by middleware)
 * Auto-creates profile if missing (handles migration-not-run or failed profile creation)
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - set by authMiddleware
        const userId = req.user?.id;
        // @ts-ignore - set by authMiddleware
        const userEmail = req.user?.email;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let { data: user, error } = await db.findUser(userId);

        // Auto-create profile if it doesn't exist
        if (error || !user) {
            const { data: newUser, error: createError } = await db.createUser(
                userId,
                userEmail || '',
                // @ts-ignore - set by authMiddleware
                req.user?.user_metadata?.name || '',
            );
            if (createError) {
                console.error('Auto-create profile error:', createError);
                return res.status(500).json({ error: 'Failed to create user profile' });
            }
            user = newUser;
        }

        res.json({ user });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

/**
 * Send password reset email via Supabase
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Always return success to avoid email enumeration
        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error('ForgotPassword Error:', error);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
};

/**
 * Update user profile (name)
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - set by authMiddleware
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name } = req.body;
        const { data: user, error } = await db.updateUser(userId, { name });
        if (error) return res.status(500).json({ error: 'Failed to update profile' });

        res.json({ user });
    } catch (error) {
        console.error('UpdateProfile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * Get user's search history
 */
export const getSearchHistory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { data: history, error } = await db.getSearchHistory(userId);
        if (error) return res.status(500).json({ error: 'Failed to fetch history' });

        res.json({ history: history || [] });
    } catch (error) {
        console.error('GetSearchHistory Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

/**
 * Clear user's search history
 */
export const clearSearchHistory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { error } = await db.clearSearchHistory(userId);
        if (error) return res.status(500).json({ error: 'Failed to clear history' });

        res.json({ cleared: true });
    } catch (error) {
        console.error('ClearSearchHistory Error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
};

/**
 * Get user stats (wishlist count, active alerts, search count)
 */
export const getUserStats = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const stats = await db.getUserStats(userId);
        res.json(stats);
    } catch (error) {
        console.error('GetUserStats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
