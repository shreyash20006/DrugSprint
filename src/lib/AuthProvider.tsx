import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Role } from '../hooks/useRole';

type AuthContextType = {
  role: Role | null;
  email: string | null;
  userId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  isSuspended: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  role: null,
  email: null,
  userId: null,
  fullName: null,
  avatarUrl: null,
  provider: null,
  isSuspended: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const resolveProfile = async (userSession: any) => {
      if (!userSession?.user) {
        console.log('[Auth] No active session.');
        if (active) {
          setRole(null);
          setIsSuspended(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const user = userSession.user;
        const provider = user.app_metadata?.provider || 'unknown';

        console.group('🔐 [AuthProvider] Resolving user profile');
        console.log('Auth User ID: ', user.id);
        console.log('Auth Email:   ', user.email);
        console.log('Provider:     ', provider);
        console.groupEnd();

        // PRIMARY: Fetch by auth user ID (correct approach)
        const { data: profileById, error: idErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (idErr) {
          console.error('[Auth] Error fetching profile by ID:', idErr);
        }

        if (profileById) {
          console.log(`[Auth] ✅ Profile found by ID. Role=${profileById.role}, Active=${profileById.is_active}`);
          if (active) {
            setRole(profileById.role as Role);
            setIsSuspended(!profileById.is_active);
          }
          return;
        }

        // FALLBACK: Match by email (handles mismatched IDs from manual inserts)
        console.warn(`[Auth] ⚠️ No profile for ID ${user.id}. Trying email fallback for ${user.email}...`);

        const { data: profileByEmail, error: emailErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (emailErr) {
          console.error('[Auth] Error fetching profile by email:', emailErr);
        }

        if (profileByEmail) {
          console.log(`[Auth] 🔧 SELF-HEAL: Found profile by email=${user.email}. DB_ID=${profileByEmail.id}, Auth_ID=${user.id}. Role=${profileByEmail.role}`);

          // Try to fix the ID mismatch in DB (only works if RLS allows it, which it does via SECURITY DEFINER trigger)
          const { error: fixErr } = await supabase.rpc('sync_profile_id', {
            p_auth_id: user.id,
            p_email: user.email
          }).maybeSingle();

          if (fixErr) {
            console.warn('[Auth] Could not auto-fix profile ID mismatch via RPC:', fixErr.message);
          } else {
            console.log('[Auth] ✅ Profile ID synced successfully via RPC.');
          }

          if (active) {
            setRole(profileByEmail.role as Role);
            setIsSuspended(!profileByEmail.is_active);
          }
          return;
        }

        // LAST RESORT: Create a student profile
        console.log(`[Auth] 🆕 No profile found anywhere. Creating student profile for ${user.email}...`);

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'student',
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Auth] Profile creation failed:', insertError);
          if (active) {
            setRole('student');
            setIsSuspended(false);
          }
        } else if (newProfile && active) {
          console.log('[Auth] ✅ Student profile created:', newProfile.role);
          setRole(newProfile.role as Role);
          setIsSuspended(!newProfile.is_active);
        }
      } catch (err) {
        console.error('[Auth] Exception in resolveProfile:', err);
        if (active) setRole(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (active) setSession(initSession);
      resolveProfile(initSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (active) setSession(newSession);
      resolveProfile(newSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        email: session?.user?.email ?? null,
        userId: session?.user?.id ?? null,
        fullName: session?.user?.user_metadata?.full_name ?? session?.user?.user_metadata?.name ?? null,
        avatarUrl: session?.user?.user_metadata?.avatar_url ?? null,
        provider: session?.user?.app_metadata?.provider ?? null,
        isSuspended,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
