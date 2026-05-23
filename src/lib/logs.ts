import { supabase } from './supabase';

/**
 * Creates an audit log entry in public.activity_logs
 * @param userEmail Email of the administrator performing the action
 * @param actionType Category of action (e.g. 'login_success', 'notice_create')
 * @param details Explicit descriptions of the action
 */
export async function logActivity(
  userEmail: string | null | undefined, 
  actionType: string, 
  details: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_email: userEmail || 'system@tgpcop.edu',
          action_type: actionType,
          details,
        }
      ]);
    
    if (error) {
      console.error('Database response error writing activity logs:', error);
    }
  } catch (err: any) {
    console.error('Execution exception writing activity logs:', err.message || err);
  }
}

export default logActivity;
