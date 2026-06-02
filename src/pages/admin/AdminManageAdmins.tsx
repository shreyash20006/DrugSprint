import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ASSIGNABLE_ROLES, getRoleDisplayName } from '../../hooks/useRole';
import type { Role, AdminUser } from '../../hooks/useRole';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { logActivity } from '../../lib/logs';
import { Users, Loader2, Plus, Save, Trash2, Search, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ExtendedAdminUser extends AdminUser {
  created_at?: string;
  full_name?: string;
}

const RoleBadgeColors: Record<Role, string> = {
  super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  president: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vice_president: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  general_secretary: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  secretary: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  treasurer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  events: 'bg-orange-600/10 text-orange-400 border-orange-600/20',
  cultural: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  nss: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  anti_ragging: 'bg-red-500/10 text-red-400 border-red-500/20',
  social_media: 'bg-pink-600/10 text-pink-400 border-pink-600/20',
  college_issues: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  student: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  developer: 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20',
};

export const AdminManageAdmins: React.FC = () => {
  const toast = useToast();
  const { email: myEmail, role: myRole } = useAuth();
  
  // Guard access: only super_admin can access role management
  const isSuperAdmin = myRole === 'super_admin' || myRole === 'developer';

  const [admins, setAdmins] = useState<ExtendedAdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; name: string; email: string; role: Role } | null>(null);

  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);
  const [newRoleForPromote, setNewRoleForPromote] = useState<Role>('admin');

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map joined profile values into a clean flat list
      const formattedAdmins = (data || []).map((row: any) => ({
        email: row.profiles?.email || 'unknown@tgpcopcouncil.online',
        name: row.profiles?.full_name || 'Council Officer',
        role: row.role as Role,
        created_at: row.created_at
      }));

      setAdmins(formattedAdmins);
      setPendingRoles({});
    } catch (err: any) {
      toast.error(`Failed to load role assignments: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const handleRoleChange = (email: string, role: Role) => {
    setPendingRoles((prev) => ({ ...prev, [email]: role }));
  };

  const saveRole = async (admin: ExtendedAdminUser) => {
    const newRole = pendingRoles[admin.email] ?? admin.role;
    if (newRole === admin.role) return;

    if (admin.email === 'sb108750@gmail.com' && myEmail !== 'sb108750@gmail.com') {
      toast.error('Unauthorized: You cannot modify the root Super Admin');
      return;
    }

    setSavingEmail(admin.email);
    try {
      // Find the user profile to retrieve the user ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', admin.email)
        .single();

      if (!profile) throw new Error('Student profile not found');

      const { error } = await supabase
        .from('admin_roles')
        .update({ role: newRole })
        .eq('user_id', profile.id);

      if (error) throw error;

      await logActivity(
        myEmail,
        'user_role_change',
        `Promoted ${admin.email} to ${newRole}`
      );
      toast.success(`Role updated to ${getRoleDisplayName(newRole)}`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(`Failed to save role: ${err.message}`);
    } finally {
      setSavingEmail(null);
    }
  };

  const handleUserLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    setIsSearchingUser(true);
    setFoundUser(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('email', lookupEmail.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.warning('No student account found with this email.');
      } else {
        setFoundUser({
          id: data.id,
          name: data.full_name || 'Student',
          email: data.email,
          role: data.role as Role
        });
      }
    } catch (err: any) {
      toast.error(`User search failed: ${err.message}`);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handlePromoteUser = async () => {
    if (!foundUser) return;

    try {
      // Check if user is already an admin
      const { data: existing } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', foundUser.id)
        .maybeSingle();

      if (existing) {
        toast.warning('This user already has a council role assigned.');
        return;
      }

      const { error } = await supabase.from('admin_roles').insert([
        {
          user_id: foundUser.id,
          role: newRoleForPromote
        }
      ]);

      if (error) throw error;

      await logActivity(
        myEmail,
        'user_create',
        `Assigned ${foundUser.email} to ${newRoleForPromote}`
      );

      toast.success(`${foundUser.name} promoted to ${getRoleDisplayName(newRoleForPromote)}`);
      setFoundUser(null);
      setLookupEmail('');
      fetchAdmins();
    } catch (err: any) {
      toast.error(`Failed to assign role: ${err.message}`);
    }
  };

  const handleDelete = async (admin: ExtendedAdminUser) => {
    if (admin.email === myEmail) {
      toast.error('Safety Lock: You cannot remove your own access permissions');
      return;
    }
    if (admin.email === 'sb108750@gmail.com') {
      toast.error('Unauthorized: You cannot modify the root Super Admin');
      return;
    }
    if (!window.confirm(`Revoke all administrative access and demote ${admin.name} to Student?`)) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', admin.email)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', profile.id);

      if (error) throw error;
      await logActivity(myEmail, 'user_delete', `Revoked access roles for ${admin.email}`);
      toast.success('Access privileges revoked. Account demoted to Student.');
      fetchAdmins();
    } catch (err: any) {
      toast.error(`Failed to revoke access: ${err.message}`);
    }
  };

  // Filter admins matching the search bar query
  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleDisplayName(admin.role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-dark p-8 border border-red-500/30 text-center rounded-2xl shadow-2xl relative overflow-hidden bg-navy-dark">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mb-2">🚫 Access Denied</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 font-sans">
            Only the **Super Admin** is authorized to view or manage role assignments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-navy-dark">
              👑 Council Role Management (RBAC)
            </h3>
            <p className="text-[10px] text-navy-dark/45 font-sans mt-0.5">
              Promote users, allocate granular access permissions, and revoke admin tokens securely
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: ASSIGN/PROMOTE NEW ROLES */}
        <div className="lg:col-span-4 bg-white border border-navy-dark/10 p-6 rounded-2xl shadow-xs space-y-5">
          <h4 className="font-display font-extrabold text-sm text-navy-dark uppercase tracking-wider flex items-center space-x-2">
            <Plus className="w-4 h-4 text-purple-600" />
            <span>Promote User by Email</span>
          </h4>

          <form onSubmit={handleUserLookup} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-dark/30" />
              <input
                type="email"
                required
                placeholder="Search user email..."
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-dark/15 text-xs outline-none focus:border-purple-600 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingUser}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-display text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isSearchingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Lookup Account &rarr;</span>
              )}
            </button>
          </form>

          {/* User Promotion Modal Section */}
          {foundUser && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-4 animate-in slide-in-from-top-3 duration-250">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs text-navy-dark truncate">{foundUser.name}</p>
                  <p className="text-[10px] text-navy-dark/45 font-mono truncate">{foundUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-navy-dark/60">
                  Target Access Role:
                </label>
                <select
                  value={newRoleForPromote}
                  onChange={(e) => setNewRoleForPromote(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 text-xs bg-white cursor-pointer"
                >
                  {ASSIGNABLE_ROLES.filter(r => r !== 'student').map((r) => (
                    <option key={r} value={r}>
                      {getRoleDisplayName(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePromoteUser}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-display text-xs font-bold rounded-lg shadow-sm"
                >
                  Confirm Promotion
                </button>
                <button
                  type="button"
                  onClick={() => setFoundUser(null)}
                  className="px-3 py-2 border border-navy-dark/15 rounded-lg text-xs font-bold text-navy-dark/65"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE ASSIGNED ROLES LIST */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-dark/30" />
            <input
              type="text"
              placeholder="Search council members by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-dark/10 bg-white outline-none focus:border-purple-600 text-xs shadow-xs"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20 bg-white border border-navy-dark/10 rounded-2xl shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-navy-dark/10 text-[9px] font-bold uppercase tracking-wider text-navy-dark/40 bg-gray-50/50">
                    <th className="px-6 py-3">Member Details</th>
                    <th className="px-6 py-3">Assigned Position</th>
                    <th className="px-6 py-3">Change Role Option</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-dark/5">
                  {filteredAdmins.map((admin) => {
                    const currentRole = pendingRoles[admin.email] ?? admin.role;
                    const hasChange = currentRole !== admin.role;

                    return (
                      <tr key={admin.email} className="hover:bg-navy-dark/[0.01]">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-display font-bold text-xs text-navy-dark">{admin.name}</span>
                            <span className="text-[10px] font-mono text-navy-dark/45 mt-0.5">{admin.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                            RoleBadgeColors[admin.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={currentRole}
                            onChange={(e) =>
                              handleRoleChange(admin.email, e.target.value as Role)
                            }
                            className="px-2 py-1.5 rounded-lg border border-navy-dark/15 text-[10px] bg-white cursor-pointer min-w-[150px]"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {getRoleDisplayName(r)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => saveRole(admin)}
                            disabled={!hasChange || savingEmail === admin.email}
                            className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-purple-600 text-white text-[10px] font-bold disabled:opacity-40 shadow-xs"
                          >
                            {savingEmail === admin.email ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            <span>Save Changes</span>
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            className="inline-flex p-1.5 rounded-lg text-navy-dark/40 hover:text-red-600 hover:bg-red-50"
                            title="Demote to Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-xs text-navy-dark/45 font-display">
                        No assigned council roles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManageAdmins;
