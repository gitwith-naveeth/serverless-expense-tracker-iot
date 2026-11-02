import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { mockUserProfile } from '../services/mockData';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfileCurrency: (currency: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(mockUserProfile);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isConfigured) {
      // Fetch user session from Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser(data);
      } else {
        setUser({
          id: userId,
          full_name: email.split('@')[0] || 'User',
          email,
          currency: 'INR',
          default_essential_amount: 100,
          default_non_essential_amount: 200,
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      setUser(mockUserProfile);
    }
  };

  const login = async (email: string) => {
    setLoading(true);
    if (isConfigured) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      setLoading(false);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    // Mock login
    setUser({
      ...mockUserProfile,
      email,
      full_name: email.split('@')[0] || 'Demo User',
    });
    setLoading(false);
    return { success: true };
  };

  const register = async (name: string, email: string) => {
    setLoading(true);
    if (isConfigured) {
      const { error } = await supabase.auth.signUp({
        email,
        password: `${crypto.randomUUID()}Aa1!`,
        options: { data: { full_name: name } }
      });
      setLoading(false);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    // Mock registration
    setUser({
      ...mockUserProfile,
      id: 'usr-' + Date.now(),
      full_name: name,
      email,
    });
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const updateProfileCurrency = (currency: string) => {
    if (user) {
      setUser({ ...user, currency });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfileCurrency }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
