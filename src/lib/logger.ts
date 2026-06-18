import { supabase } from './supabase';

/**
 * Audit logger for tracking administrative actions in the admin_logs table.
 * Resolves the logged-in administrator's name dynamically by email.
 *
 * @param action The string identifier for the action (e.g. LOGIN, ADDED_NOTICE)
 * @param details Optional contextual information/string details
 */
export async function logAction(action: string, details?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return;
    
    // Query active name in the roles roster by authenticated email
    const { data: adminUser } = await supabase
      .from('admin_roles')
      .select('name')
      .eq('email', session.user.email)
      .single();

    await supabase.from('admin_logs').insert({
      admin_email: session.user.email,
      admin_name: adminUser?.name || 'Unknown',
      action,
      details: details || null
    });
  } catch (err) {
    console.error('Failed to write audit action log:', err);
  }
}
