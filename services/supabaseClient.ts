import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseActive = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};

export const supabase = isSupabaseActive() 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null as any;

