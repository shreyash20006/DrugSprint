import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Role =
  | 'super_admin'
  | 'admin'
  | 'president'
  | 'vice_president'
  | 'general_secretary'
  | 'secretary'
  | 'treasurer'
  | 'events'
  | 'cultural'
  | 'nss'
  | 'anti_ragging'
  | 'social_media'
  | 'college_issues'
  | 'student'
  | 'developer'; // Retained for developer panel integrity

export const ASSIGNABLE_ROLES: Role[] = [
  'super_admin',
  'admin',
  'president',
  'vice_president',
  'general_secretary',
  'secretary',
  'treasurer',
  'events',
  'cultural',
  'nss',
  'anti_ragging',
  'social_media',
  'college_issues',
  'student',
  'developer'
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
    admin: 'Overall Secretary (Admin)',
    president: 'President',
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    events: 'Events & Workshop Coordinator',
    cultural: 'Cultural Secretary',
    nss: 'NSS Incharge',
    anti_ragging: 'Anti-Ragging Incharge',
    social_media: 'Social Media Incharge',
    college_issues: 'College Issues Representative',
    student: 'Student',
    developer: 'Developer',
  };
  return labels[role] || 'Student';
}

export function getPositionTitle(role: Role): string {
  const titles: Record<Role, string> = {
    super_admin: 'President Emeritus',
    admin: 'Overall Secretary',
    president: 'Student Council President',
    vice_president: 'Council Vice President',
    general_secretary: 'General Secretary',
    secretary: 'Executive Secretary',
    treasurer: 'Council Treasurer',
    events: 'Events & Workshop Coordinator',
    cultural: 'Cultural Secretary',
    nss: 'NSS Incharge',
    anti_ragging: 'Anti-Ragging Committee Head',
    social_media: 'Social Media Officer',
    college_issues: 'College Issues Representative',
    student: 'Student Member',
    developer: 'Lead Systems Developer',
  };
  return titles[role] || 'Student Member';
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
    
    // Super Admins & Developers bypass all checks and get full access
    if (role === 'super_admin' || role === 'developer') return true;

    // Granular RBAC Permissions Matching Specification
    switch (action) {
      case 'view_dashboard':
        // President, Vice President, Treasurer, and Admins can view leadership dashboard
        return ['admin', 'president', 'vice_president', 'treasurer', 'events', 'cultural', 'nss', 'anti_ragging', 'social_media', 'college_issues', 'general_secretary', 'secretary'].includes(role);
      
      case 'add_notices':
      case 'edit_notices':
        return ['admin', 'general_secretary', 'secretary', 'social_media'].includes(role);
      
      case 'delete_notices':
        return ['admin', 'general_secretary'].includes(role);
      
      case 'approve_notices':
        return ['president', 'vice_president'].includes(role);

      case 'add_events':
      case 'edit_events':
      case 'delete_events':
        return ['admin', 'events', 'cultural', 'nss'].includes(role);

      case 'upload_gallery':
      case 'delete_gallery':
        return ['admin', 'cultural', 'social_media'].includes(role);

      case 'view_registrations':
      case 'manage_registrations':
        return ['admin', 'events', 'cultural', 'nss', 'general_secretary'].includes(role);
      
      case 'generate_event_passes':
        return ['admin', 'events'].includes(role);

      case 'view_complaints':
      case 'resolve_complaints':
        return ['admin', 'president', 'vice_president', 'anti_ragging', 'college_issues'].includes(role);

      case 'view_payments':
      case 'view_reports':
        return ['admin', 'president', 'vice_president', 'treasurer', 'general_secretary', 'secretary'].includes(role);

      case 'manage_payments':
      case 'download_receipts':
      case 'financial_analytics':
        return ['treasurer'].includes(role);

      case 'manage_student_activities':
        return ['admin', 'general_secretary'].includes(role);

      case 'view_questions':
      case 'reply_questions':
        return ['admin', 'president', 'vice_president', 'general_secretary', 'secretary'].includes(role);

      case 'delete_questions':
        return ['admin'].includes(role);

      case 'view_feedback':
        return ['admin', 'president', 'vice_president', 'college_issues'].includes(role);

      case 'manage_banners':
        return ['social_media'].includes(role);

      case 'manage_settings':
        return ['admin'].includes(role);

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
