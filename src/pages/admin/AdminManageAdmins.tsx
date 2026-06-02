import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ASSIGNABLE_ROLES, getRoleDisplayName } from '../../hooks/useRole';
import type { Role, AdminUser } from '../../hooks/useRole';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { logActivity } from '../../lib/logs';
import { Users, Loader2, Plus, Save, Trash2 } from 'lucide-react';

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

  return (
    <RequirePermission permission="manage_admins">
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-navy-dark">
                👥 Manage Admins
              </h3>
              <p className="text-[10px] text-navy-dark/45 font-sans mt-0.5">
                Assign roles for council admin panel access
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-orange-burnt text-white rounded-lg font-display text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddAdmin}
            className="bg-orange-burnt/5 border border-orange-burnt/20 rounded-2xl p-5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="Full name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className="px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm outline-none focus:border-orange-burnt"
              />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm outline-none focus:border-orange-burnt"
              />
              <select
                value={newAdmin.role}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, role: e.target.value as Role })
                }
                className="px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm bg-white cursor-pointer"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {getRoleDisplayName(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-burnt text-white rounded-lg text-xs font-bold"
              >
                Insert Admin
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-navy-dark/15 rounded-lg text-xs font-bold text-navy-dark/60"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-burnt" />
          </div>
        ) : (
          <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-navy-dark/10 text-[10px] font-bold uppercase tracking-wider text-navy-dark/40 bg-gray-50/50">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-dark/5">
                {admins.map((admin) => {
                  const currentRole = pendingRoles[admin.email] ?? admin.role;
                  const hasChange = currentRole !== admin.role;

                  return (
                    <tr key={admin.email} className="hover:bg-navy-dark/[0.01]">
                      <td className="px-6 py-4 font-display font-bold text-sm text-navy-dark">
                        {admin.name}
                      </td>
                      <td className="px-6 py-4 text-xs text-navy-dark/60 font-mono">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={currentRole}
                          onChange={(e) =>
                            handleRoleChange(admin.email, e.target.value as Role)
                          }
                          className="px-2 py-1.5 rounded-lg border border-navy-dark/15 text-xs bg-white cursor-pointer min-w-[140px]"
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {getRoleDisplayName(r)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => saveRole(admin)}
                          disabled={!hasChange || savingEmail === admin.email}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-orange-burnt text-white text-xs font-bold disabled:opacity-40"
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
                          className="inline-flex p-1.5 rounded-lg text-navy-dark/40 hover:text-red-600 hover:bg-red-50"
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
        )}
      </div>
    </RequirePermission>
  );
};

export default AdminManageAdmins;
