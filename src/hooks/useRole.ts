import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Role =
  | 'super_admin'
  | 'admin'
  | 'developer'
  | 'president'
  | 'vice_president'
  | 'general_secretary'
  | 'secretary'
  | 'treasurer'
  | 'coordinator'
  | 'student';

export const ASSIGNABLE_ROLES: Role[] = [
  'super_admin',
  'admin',
  'developer',
  'president',
  'vice_president',
  'general_secretary',
  'secretary',
  'treasurer',
  'coordinator',
  'student',
];

export interface AdminUser {
  email: string;
  name: string;
  role: Role;
}

export function isDeveloper(role?: Role | null): boolean {
  return role === 'developer';
}

export function getRoleDisplayName(role: Role): string {
  const labels: Record<Role, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    developer: 'Developer',
    president: 'President',
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    coordinator: 'Coordinator',
    student: 'Student',
  };
  return labels[role] || 'Student';
}

export function getPositionTitle(role: Role): string {
  const titles: Record<Role, string> = {
    super_admin: 'President Emeritus',
    admin: 'Executive Administrator',
    developer: 'Lead Systems Developer',
    president: 'Student Council President',
    vice_president: 'Council Vice President',
    general_secretary: 'General Secretary',
    secretary: 'Executive Secretary',
    treasurer: 'Council Treasurer',
    coordinator: 'Events Coordinator',
    student: 'Student Pioneer',
  };
  return titles[role] || 'Student';
}

export function useRole() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('email, full_name, role')
          .eq('id', session.user.id)
          .single();

        if (queryError || !data) {
          setError('User profile not found in Supabase');
          setLoading(false);
          return;
        }

        setAdminUser({
          email: data.email,
          name: data.full_name || 'Student',
          role: data.role as Role
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch role:', err);
        setError('Failed to fetch user role');
        setLoading(false);
      }
    }

    fetchRole();
  }, []);

  const can = (action: string): boolean => {
    if (!adminUser) return false;
    
    const role = adminUser.role;
    
    // super_admin gets full access
    if (role === 'super_admin') return true;

    // developer gets most access except changing other admins' roles
    if (role === 'developer') {
      const devRestricted = ['manage_all_roles'];
      if (devRestricted.includes(action)) return false;
      return true; 
    }

    // Role-specific actions matching specified permissions
    switch (action) {
      case 'view_dashboard':
        return role !== 'student';
      case 'add_notices':
      case 'edit_notices':
        return ['admin', 'developer', 'president', 'general_secretary'].includes(role);
      case 'delete_notices':
        return ['admin', 'developer', 'president'].includes(role);
      case 'add_events':
      case 'edit_events':
        return ['admin', 'developer', 'vice_president', 'coordinator'].includes(role);
      case 'delete_events':
        return ['admin', 'developer'].includes(role);
      case 'upload_gallery':
        return ['admin', 'developer', 'vice_president', 'coordinator'].includes(role);
      case 'delete_gallery':
        return ['admin', 'developer'].includes(role);
      case 'view_registrations':
        return ['admin', 'developer', 'vice_president', 'general_secretary', 'coordinator'].includes(role);
      case 'scan_qr_checkin':
      case 'view_attendance':
        return ['admin', 'developer', 'vice_president', 'general_secretary', 'coordinator', 'secretary', 'treasurer', 'president'].includes(role);
      case 'manage_checkin':
        return ['super_admin', 'developer'].includes(role);
      case 'manage_polls':
        return ['admin', 'developer', 'president', 'vice_president'].includes(role);
      case 'view_feedback':
        return ['admin', 'developer', 'president', 'vice_president'].includes(role);
      case 'manage_achievements':
        return ['admin', 'developer', 'president'].includes(role);
      case 'manage_newsletter':
        return ['admin', 'developer', 'president', 'general_secretary', 'secretary'].includes(role);
      case 'view_complaints':
        return ['president'].includes(role);
      case 'manage_mentors':
        return ['admin', 'developer', 'president', 'vice_president'].includes(role);
      case 'view_questions':
      case 'reply_questions':
        return ['admin', 'developer', 'president', 'general_secretary', 'secretary'].includes(role);
      case 'delete_questions':
        return ['admin', 'developer', 'president'].includes(role);
      case 'manage_settings':
        return ['admin', 'developer', 'president'].includes(role);
      case 'view_payments':
      case 'manage_payments':
        return ['admin', 'developer', 'treasurer'].includes(role);
      case 'view_reports':
        return ['president', 'treasurer'].includes(role);
      case 'view_database':
      case 'manage_admins':
      case 'developer_settings':
        return ['developer'].includes(role);
      default:
        return false;
    }
  };

  return {
    adminUser,
    loading,
    error,
    can,
    isDev: isDeveloper(adminUser?.role),
  };
}

export default useRole;
