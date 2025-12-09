// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

// Default Supabase credentials (can be overridden via Settings)
const DEFAULT_SUPABASE_URL = 'https://frmfspnkkyudiojsqwhe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWZzcG5ra3l1ZGlvanNxd2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODU4NjcsImV4cCI6MjA4MDg2MTg2N30.KijEF8GotSPapoXdUOd8SpIMWggQhSa6TGQKcgKUcqs';

// Get credentials from localStorage or use defaults
const getSupabaseUrl = () => {
    return localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
};

const getSupabaseAnonKey = () => {
    return localStorage.getItem('supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;
};

// Create Supabase client
let supabaseClient = null;

export const getSupabase = () => {
    if (!supabaseClient) {
        supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
    }
    return supabaseClient;
};

// Reinitialize client with new credentials (called when settings change)
export const reinitializeSupabase = () => {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
    return supabaseClient;
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    return url && key && url.includes('supabase.co');
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.from('manuals').select('count').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

// Save Supabase configuration
export const saveSupabaseConfig = (url, anonKey) => {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', anonKey);
    reinitializeSupabase();
};

export default getSupabase;
