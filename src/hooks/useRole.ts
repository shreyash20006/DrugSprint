import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Role =
  | 'developer'
  | 'super_admin'
  | 'admin'
  | 'secretary'
  | 'events'
  | 'gallery'
  | 'questions'
  | 'treasurer'
  | 'limited'
  | 'antiragging';

export const ASSIGNABLE_ROLES: Role[] = [
  'super_admin',
  'admin',
  'secretary',
  'events',
  'gallery',
  'questions',
  'treasurer',
  'limited',
  'developer',
  'antiragging',
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
    developer: 'Developer',
    super_admin: 'Super Admin',
    admin: 'Admin',
    secretary: 'Secretary',
    events: 'Events',
    gallery: 'Gallery',
    questions: 'Questions',
    treasurer: 'Treasurer',
    limited: 'Limited',
    antiragging: 'Anti-Ragging',
  };
  return labels[role];
}

export function getPositionTitle(role: Role): string {
  const titles: Record<Role, string> = {
    developer: 'Developer',
    super_admin: 'President',
    admin: 'Executive',
    secretary: 'Secretary',
    events: 'Events Coordinator',
    gallery: 'Gallery Manager',
    questions: 'Questions Manager',
    treasurer: 'Treasurer',
    limited: 'Council Member',
    antiragging: 'Anti-Ragging Cell',
  };
  return titles[role];
}

function withDeveloper(roles: Role[]): Role[] {
  if (roles.includes('developer')) return roles;
  return [...roles, 'developer'];
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
          .from('admin_roles')
          .select('email, name, role')
          .eq('email', session.user.email)
          .single();

        if (queryError) {
          setError('User role not found');
          setLoading(false);
          return;
        }

        setAdminUser(data as AdminUser);
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
    if (adminUser.role === 'developer') return true;

    const role = adminUser.role;

    const permissions: Record<string, Role[]> = {
      view_questions: withDeveloper([
        'super_admin',
        'admin',
        'secretary',
        'questions',
        'limited',
      ]),
      reply_questions: withDeveloper([
        'super_admin',
        'admin',
        'secretary',
        'questions',
      ]),
      delete_questions: withDeveloper(['super_admin', 'admin']),
      add_notices: withDeveloper(['super_admin', 'admin', 'secretary']),
      edit_notices: withDeveloper(['super_admin', 'admin', 'secretary']),
      delete_notices: withDeveloper(['super_admin', 'admin']),
      add_events: withDeveloper(['super_admin', 'admin', 'events']),
      edit_events: withDeveloper(['super_admin', 'admin', 'events']),
      delete_events: withDeveloper(['super_admin', 'admin']),
      upload_gallery: withDeveloper(['super_admin', 'admin', 'events', 'gallery']),
      delete_gallery: withDeveloper(['super_admin', 'admin']),
      manage_settings: withDeveloper(['super_admin', 'admin']),
      view_dashboard: withDeveloper([
        'super_admin',
        'admin',
        'secretary',
        'events',
        'gallery',
        'questions',
        'treasurer',
        'limited',
      ]),
      view_database: ['developer'],
      manage_admins: ['developer'],
      developer_settings: ['developer'],
      view_registrations: withDeveloper(['super_admin', 'admin', 'events']),
      manage_polls: withDeveloper(['super_admin', 'admin']),
      view_feedback: withDeveloper(['super_admin', 'admin', 'events']),
      manage_achievements: withDeveloper(['super_admin', 'admin']),
      manage_newsletter: withDeveloper(['super_admin', 'admin', 'secretary']),
      view_complaints: withDeveloper(['super_admin', 'antiragging']),
      manage_mentors: withDeveloper(['super_admin', 'admin']),
    };

    return permissions[action]?.includes(role) ?? false;
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
