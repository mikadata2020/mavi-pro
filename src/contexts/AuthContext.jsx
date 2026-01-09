import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [roleError, setRoleError] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserRole = async (userId) => {
        try {
            setRoleError(null);
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.warn('Error fetching user role:', error);
                setRoleError(error.message);
                setUserRole('user');
            } else {
                setUserRole(data?.role || 'user');
                setRoleError(null);
            }
        } catch (error) {
            console.error('Error in fetchUserRole:', error);
            setRoleError(error.message);
            setUserRole('user');
        }
    };

    useEffect(() => {
        const supabase = getSupabase();

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            }
            setLoading(false);
        }).catch(err => {
            console.error('Error checking session:', err);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setUserRole(null);
            }
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
        setUserRole(null);
        return supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        userRole,
        roleError,
        signIn,
        signUp,
        signOut,
        refreshRole: () => user && fetchUserRole(user.id),
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
