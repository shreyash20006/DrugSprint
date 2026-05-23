import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';

interface AuthContextType {
  role: 'super_admin' | 'admin' | 'moderator' | 'notice_manager' | 'content_editor' | null;
  email: string | null;
  userId: string | null;
  isSuspended: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  email: null,
  userId: null,
  isSuspended: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<any>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const resolveProfile = async (userSession: any) => {
      if (!userSession?.user) {
        if (active) {
          setRole(null);
          setIsSuspended(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const user = userSession.user;

        // Auto-provision Super Admin profile if it is the designated email
        if (user.email === 'shrey@tgpcopconcil.com') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!profile) {
            const { error: seedError } = await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              role: 'super_admin',
              is_suspended: false,
            });
            if (seedError) console.error('Error auto-seeding Super Admin profile:', seedError);
          }
        }

        // Fetch current profile role and suspension status
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (active) {
          setRole(profile?.role || null);
          setIsSuspended(profile?.is_suspended || false);
        }
      } catch (err) {
        console.error('Error resolving admin profile:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (active) {
        setSession(initSession);
      }
      resolveProfile(initSession);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (active) {
        setSession(newSession);
      }
      resolveProfile(newSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
        <p className="font-display text-sm tracking-wider text-white/70 uppercase">
          Verifying Security Access...
        </p>
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  // Handle suspended administrator accounts
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-dark p-8 border border-red-500/20 text-center rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mb-2">Access Suspended</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 font-sans">
            Your administrator account (`{session.user.email}`) has been suspended by the Super Admin. Please contact the college administration to restore your access permissions.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-display font-bold rounded-lg text-sm transition-colors mx-auto w-full shadow-md shadow-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out From Console</span>
          </button>
        </div>
      </div>
    );
  }

  // Handle case where user is authenticated but has no profile role assigned
  if (!role) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-dark p-8 border border-orange-burnt/20 text-center rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-orange-burnt/10 border border-orange-burnt/30 flex items-center justify-center text-orange-burnt mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mb-2">Access Restricted</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 font-sans">
            Your account (`{session.user.email}`) does not have any active administrator role permissions assigned yet. An administrator must approve your role before you can access the console.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display font-bold rounded-lg text-sm transition-colors mx-auto w-full shadow-md shadow-orange-burnt/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out From Console</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        email: session.user.email,
        userId: session.user.id,
        isSuspended,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default ProtectedRoute;
