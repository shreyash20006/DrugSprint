import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  year: string;
  phone: string;
  created_at: string;
  role?: string;
  is_active?: boolean;
  course?: string;
  semester?: string;
  prn?: string;
  linkedin_id?: string;
}

type StudentAuthContextType = {
  studentUser: any | null;
  studentProfile: StudentProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmailDemo: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const StudentAuthContext = createContext<StudentAuthContextType>({
  studentUser: null,
  studentProfile: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  loginWithEmailDemo: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useStudentAuth = () => useContext(StudentAuthContext);

export const StudentAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentUser, setStudentUser] = useState<any | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSyncProfile = async (user: any) => {
    if (!user) {
      setStudentProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log(`[StudentAuth] Syncing profile for user: email=${user.email}, id=${user.id}`);
      
      // 1. Try to fetch existing student profile by ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[StudentAuth] Error fetching student profile:', error);
      }

      if (profile) {
        console.log('[StudentAuth] Found profile by ID:', profile);
        setStudentProfile(profile);
      } else {
        console.warn(`[StudentAuth] Profile not found for ID ${user.id}. Querying by email fallback...`);
        
        // 2. Fallback: Query by email to handle pre-seeded/mismatched profiles
        const { data: profileByEmail, error: emailErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (emailErr) {
          console.error('[StudentAuth] Database error fetching profile by email fallback:', emailErr);
        }

        if (profileByEmail) {
          console.log(`[StudentAuth] SELF-HEALING: Found profile by email ${user.email} but with mismatched ID! Database ID=${profileByEmail.id}, Google ID=${user.id}.`);
          setStudentProfile(profileByEmail);
        } else {
          console.log('[StudentAuth] No profile exists. Creating new student profile client-side...');
          const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student',
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || '',
            year: 'First Year', // Default value
            phone: '',
            role: 'student',
            is_active: true
          };

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (insertError) {
            console.error('[StudentAuth] Error creating student profile:', insertError);
          } else if (createdProfile) {
            console.log('[StudentAuth] Created new student profile successfully:', createdProfile);
            setStudentProfile(createdProfile);
          }
        }
      }
    } catch (err) {
      console.error('[StudentAuth] Failed to sync student profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        setStudentUser(session.user);
        fetchAndSyncProfile(session.user);
      } else {
        setStudentUser(null);
        setStudentProfile(null);
        setIsLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setStudentUser(session.user);
        fetchAndSyncProfile(session.user);
      } else {
        setStudentUser(null);
        setStudentProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      try {
        console.log('[StudentAuth] Starting native Google Sign-in...');
        GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        
        if (!idToken) {
          throw new Error('Google Auth did not return an ID token.');
        }

        console.log('[StudentAuth] Logging in to Supabase with ID token...');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) throw error;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
      return;
    }

    // Web OAuth Fallback
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/profile',
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });
    
    if (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      try {
        return window.crypto.randomUUID();
      } catch (e) {
        // ignore and fallback
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const loginWithEmailDemo = async (email: string) => {
    setIsLoading(true);
    const demoId = generateUUID();
    const fallbackProfile: StudentProfile = {
      id: demoId,
      user_id: demoId,
      full_name: 'Demo Student',
      email: email,
      avatar_url: '',
      year: 'First Year',
      phone: '',
      created_at: new Date().toISOString(),
      role: 'student',
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
      if (error || !data) {
        if (error) {
          console.warn('[StudentAuth] Database error in select, trying insertion fallback:', error);
        }
        // Try inserting it
        try {
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert([fallbackProfile])
            .select()
            .single();
            
          if (insertError) {
            console.warn('[StudentAuth] Database insert failed, using local-only session:', insertError);
            setStudentUser({ id: fallbackProfile.id, email: email });
            setStudentProfile(fallbackProfile);
          } else {
            setStudentUser({ id: created.id, email: email });
            setStudentProfile(created);
          }
        } catch (insertCatch) {
          console.warn('[StudentAuth] Database insert catch, using local-only session:', insertCatch);
          setStudentUser({ id: fallbackProfile.id, email: email });
          setStudentProfile(fallbackProfile);
        }
      } else {
        setStudentUser({ id: data.id, email: data.email });
        setStudentProfile(data);
      }
    } catch (err) {
      console.warn('[StudentAuth] Network/general error in demo login, using local-only session:', err);
      setStudentUser({ id: fallbackProfile.id, email: email });
      setStudentProfile(fallbackProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setStudentUser(null);
    setStudentProfile(null);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (studentUser) {
      await fetchAndSyncProfile(studentUser);
    }
  };

  return (
    <StudentAuthContext.Provider
      value={{
        studentUser,
        studentProfile,
        isLoading,
        signInWithGoogle,
        loginWithEmailDemo,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
};
