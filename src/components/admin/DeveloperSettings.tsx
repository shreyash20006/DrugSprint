import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './ProtectedRoute';
import { useToast } from './Toast';
import { logActivity } from '../../lib/logs';
import {
  Wrench,
  Loader2,
  AlertTriangle,
  BellOff,
  ScrollText,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface ActivityLogRow {
  id?: string;
  user_email: string;
  action_type: string;
  details: string;
  created_at: string;
}

const ERROR_ACTION_TYPES = ['login_fail', 'bug_reported'];

export const DeveloperSettings: React.FC = () => {
  const { email: myEmail } = useAuth();
  const toast = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ActivityLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadDeveloperSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['maintenance_mode']);

      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });
      setMaintenanceMode(map.maintenance_mode === 'true');
    } catch (err: any) {
      toast.error(`Failed to load developer settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErrorLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .in('action_type', ERROR_ACTION_TYPES)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setErrorLogs((data as ActivityLogRow[]) || []);
    } catch (err: any) {
      toast.error(`Failed to load error logs: ${err.message}`);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadDeveloperSettings();
    fetchErrorLogs();
  }, []);

  const toggleMaintenance = async () => {
    const next = !maintenanceMode;
    setIsSavingMaintenance(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'maintenance_mode',
        value: next ? 'true' : 'false',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setMaintenanceMode(next);
      await logActivity(
        myEmail,
        'developer_maintenance',
        `Maintenance mode ${next ? 'enabled' : 'disabled'}`
      );
      toast.success(
        next ? 'Maintenance mode ON — public site shows banner' : 'Maintenance mode OFF'
      );
    } catch (err: any) {
      toast.error(`Failed to update maintenance mode: ${err.message}`);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const clearNotifications = async () => {
    if (
      !window.confirm(
        'Clear stored site notifications? This resets the notification queue in settings.'
      )
    ) {
      return;
    }
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'site_notifications',
        value: JSON.stringify([]),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      await logActivity(myEmail, 'developer_clear_notifications', 'Cleared site notifications');
      toast.success('All notifications cleared');
    } catch (err: any) {
      toast.error(`Failed to clear notifications: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-navy-dark/40">
        <Loader2 className="w-6 h-6 animate-spin text-orange-burnt mr-2" />
        <span className="text-sm">Loading developer settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-navy-dark/5 border-2 border-orange-burnt/30 rounded-2xl shadow-xs p-6 space-y-6">
      <div className="flex items-center space-x-2 pb-3 border-b border-orange-burnt/20">
        <Wrench className="w-5 h-5 text-orange-burnt" />
        <h4 className="font-display font-bold text-sm text-navy-dark">
          Developer Settings
        </h4>
        <span className="ml-auto text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-burnt text-white">
          DEV ONLY
        </span>
      </div>

      {/* Maintenance mode */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-navy-dark/10">
        <div>
          <p className="font-display font-bold text-sm text-navy-dark">Site maintenance mode</p>
          <p className="text-xs text-navy-dark/50 mt-0.5">
            Shows an &quot;Under Maintenance&quot; banner on the public website
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMaintenance}
          disabled={isSavingMaintenance}
          className="flex items-center space-x-2 text-orange-burnt disabled:opacity-50"
          aria-pressed={maintenanceMode}
        >
          {maintenanceMode ? (
            <ToggleRight className="w-10 h-10" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-navy-dark/30" />
          )}
        </button>
      </div>

      {/* Clear notifications */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-navy-dark/10">
        <div>
          <p className="font-display font-bold text-sm text-navy-dark">Clear all notifications</p>
          <p className="text-xs text-navy-dark/50 mt-0.5">
            Resets the site notification queue stored in settings
          </p>
        </div>
        <button
          type="button"
          onClick={clearNotifications}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors"
        >
          <BellOff className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Error logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ScrollText className="w-4 h-4 text-orange-burnt" />
            <p className="font-display font-bold text-sm text-navy-dark">Error logs</p>
          </div>
          <button
            type="button"
            onClick={fetchErrorLogs}
            disabled={isLoadingLogs}
            className="text-xs font-bold text-orange-burnt hover:underline disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-navy-dark/10 bg-white divide-y divide-navy-dark/5">
          {isLoadingLogs ? (
            <div className="p-6 text-center text-navy-dark/40 text-xs">Loading logs...</div>
          ) : errorLogs.length === 0 ? (
            <div className="p-6 text-center text-navy-dark/40 text-xs">No error logs found</div>
          ) : (
            errorLogs.map((log, i) => (
              <div key={log.id ?? i} className="p-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-bold text-red-600 uppercase tracking-wide">
                    {log.action_type}
                  </span>
                  <span className="text-navy-dark/40 ml-auto">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-navy-dark/70 font-mono text-[10px]">{log.user_email}</p>
                <p className="text-navy-dark/80 mt-1 leading-relaxed">{log.details}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperSettings;
