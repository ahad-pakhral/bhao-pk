import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Credentials missing. Auth and database features will not work.');
}

// Mock global WebSocket if undefined (e.g. Node.js < 22) to prevent Supabase Realtime client from crashing
if (typeof (global as any).WebSocket === 'undefined') {
  (global as any).WebSocket = class {};
}

// Client for general use (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for backend tasks (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
