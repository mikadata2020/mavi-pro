import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabase();

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(err => {
            console.error('Error checking session:', err);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const supabase = getSupabase();
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = async (email, password) => {
        const supabase = getSupabase();
        return supabase.auth.signUp({ email, password });
    };

    const signOut = async () => {
        const supabase = getSupabase();
        return supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        signIn,
        signUp,
        signOut,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
