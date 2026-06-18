import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ASSIGNABLE_ROLES, getRoleDisplayName } from '../../hooks/useRole';
import type { Role, AdminUser } from '../../hooks/useRole';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { logActivity } from '../../lib/logs';
import { Loader2, Plus, Save, Trash2, X, UserCog } from 'lucide-react';

const ROLE_BADGE_MAP: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  developer:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  president:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vice_president: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  general_secretary: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  secretary:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
  treasurer:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  coordinator: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  student:     'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const AdminManageAdmins: React.FC = () => {
  const toast = useToast();
  const { email: myEmail } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'admin' as Role });

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('email, name, role')
        .order('name');

      if (error) throw error;
      setAdmins((data as AdminUser[]) || []);
      setPendingRoles({});
    } catch (err: any) {
      toast.error(`Failed to load admins: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleRoleChange = (email: string, role: Role) => {
    setPendingRoles((prev) => ({ ...prev, [email]: role }));
  };

  const saveRole = async (admin: AdminUser) => {
    const newRole = pendingRoles[admin.email] ?? admin.role;
    if (newRole === admin.role) return;

    setSavingEmail(admin.email);
    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ role: newRole })
        .eq('email', admin.email);

      if (error) throw error;
      await logActivity(
        myEmail,
        'user_role_change',
        `Changed role for ${admin.email} to ${newRole}`
      );
      toast.success(`Role updated for ${admin.name}`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.message}`);
    } finally {
      setSavingEmail(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      const { error } = await supabase.from('admin_roles').insert([
        {
          name: newAdmin.name.trim(),
          email: newAdmin.email.trim().toLowerCase(),
          role: newAdmin.role,
        },
      ]);

      if (error) throw error;
      await logActivity(
        myEmail,
        'user_create',
        `Added admin ${newAdmin.email} as ${newAdmin.role}`
      );
      toast.success('Admin added successfully');
      setNewAdmin({ name: '', email: '', role: 'admin' });
      setShowAddForm(false);
      fetchAdmins();
    } catch (err: any) {
      toast.error(`Failed to add admin: ${err.message}`);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    if (admin.email === myEmail) {
      toast.error('You cannot remove your own admin account');
      return;
    }
    if (!window.confirm(`Remove ${admin.name} from admin roles?`)) return;

    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('email', admin.email);

      if (error) throw error;
      await logActivity(myEmail, 'user_delete', `Removed admin ${admin.email}`);
      toast.success('Admin removed');
      fetchAdmins();
    } catch (err: any) {
      toast.error(`Failed to remove admin: ${err.message}`);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm placeholder-white/30 outline-none focus:border-orange-burnt/50 focus:bg-white/[0.06] transition-all";
  const selectCls = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm outline-none focus:border-orange-burnt/50 transition-all appearance-none cursor-pointer";

  return (
    <RequirePermission permission="manage_admins">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
              <UserCog className="w-5 h-5 text-orange-burnt" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-white">Manage Admins</h2>
              <p className="text-xs text-white/40 font-sans mt-0.5">Assign roles for council admin panel access</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl font-display text-xs font-bold shadow-md hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Cancel' : 'Add Admin'}</span>
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddAdmin}
            className="bg-orange-burnt/5 border border-orange-burnt/20 rounded-2xl p-5 space-y-4"
          >
            <p className="text-xs font-display font-bold text-orange-burnt/80 uppercase tracking-wider">New Admin Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="Full name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className={inputCls}
              />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className={inputCls}
              />
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as Role })}
                className={selectCls}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#0A1428]">
                    {getRoleDisplayName(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all"
              >
                Insert Admin
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Admins Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin text-orange-burnt mb-3" />
            <span className="font-display text-sm">Loading admin roster...</span>
          </div>
        ) : (
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Change Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {admins.map((admin) => {
                    const currentRole = pendingRoles[admin.email] ?? admin.role;
                    const hasChange = currentRole !== admin.role;
                    const badgeCls = ROLE_BADGE_MAP[admin.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

                    return (
                      <tr key={admin.email} className="hover:bg-white/[0.025] transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-display font-bold text-sm text-white group-hover:text-orange-100 transition-colors">
                            {admin.name}
                          </span>
                          {admin.email === myEmail && (
                            <span className="ml-2 text-[9px] bg-orange-burnt/20 text-orange-burnt border border-orange-burnt/30 px-1.5 py-0.5 rounded font-bold">You</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-white/50 font-mono">{admin.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badgeCls}`}>
                            {getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={currentRole}
                            onChange={(e) => handleRoleChange(admin.email, e.target.value as Role)}
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] text-white/80 text-xs cursor-pointer min-w-[140px] outline-none focus:border-orange-burnt/50 appearance-none transition-all"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r} className="bg-[#0A1428]">
                                {getRoleDisplayName(r)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => saveRole(admin)}
                            disabled={!hasChange || savingEmail === admin.email}
                            className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-xl bg-orange-burnt/20 hover:bg-orange-burnt text-orange-burnt hover:text-white text-xs font-bold disabled:opacity-30 transition-all border border-orange-burnt/30"
                          >
                            {savingEmail === admin.email ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            className="inline-flex p-1.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-white/5">
              <p className="text-[10px] text-white/25 font-sans">{admins.length} admin{admins.length !== 1 ? 's' : ''} with portal access</p>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
};

export default AdminManageAdmins;
