import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';

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
}

type StudentAuthContextType = {
  studentUser: any | null;
  studentProfile: StudentProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const StudentAuthContext = createContext<StudentAuthContextType>({
  studentUser: null,
  studentProfile: null,
  isLoading: true,
  signInWithGoogle: async () => {},
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/profile',
        queryParams: {
          // Show account picker every time
          prompt: 'select_account',
          // Allow both Gmail AND Google Workspace accounts
          // No 'hd' restriction — accept all Google accounts
          access_type: 'offline',
        },
      },
    });
    if (error) {
      setIsLoading(false);
      throw error;
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
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
};
