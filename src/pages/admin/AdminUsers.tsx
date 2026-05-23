import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { sendAdminNotification } from '../../lib/brevo';
import {
  Users, Plus, Trash2, ShieldAlert, ShieldCheck, RotateCcw,
  Loader2, Eye, EyeOff, X, Check
} from 'lucide-react';

const ROLES = ['admin', 'moderator', 'notice_manager', 'content_editor'] as const;
type Role = typeof ROLES[number];

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, string> = {
    super_admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    moderator: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    notice_manager: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    content_editor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  };
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${map[role] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {role.replace('_', ' ')}
    </span>
  );
};

export const AdminUsers: React.FC = () => {
  const { email: myEmail } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('admin');
  const [showPw, setShowPw] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Reset password
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetPw, setResetPw] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error('❌ Failed to load users: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Create new user via RPC ──────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    if (newPassword.length < 8) {
      toast.warning('⚠️ Password must be at least 8 characters.');
      return;
    }
    setIsCreating(true);
    try {
      const { error } = await supabase.rpc('create_new_user', {
        user_email: newEmail,
        user_password: newPassword,
        user_role: newRole,
      });
      if (error) throw error;
      await logActivity(myEmail, 'user_create', `Created user "${newEmail}" with role "${newRole}"`);
      await sendAdminNotification({
        subject: '👤 New Admin User Created',
        title: 'New User Added to Portal',
        bodyHtml: `<p><b>Email:</b> ${newEmail}</p><p><b>Role:</b> ${newRole}</p><p>Created by: ${myEmail}</p>`,
      });
      toast.success(`✅ User "${newEmail}" created successfully!`);
      setShowAddForm(false);
      setNewEmail(''); setNewPassword(''); setNewRole('admin');
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to create user: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // ── Toggle Suspension ────────────────────────────────────────────────────
  const handleToggleSuspend = async (user: any) => {
    const action = user.is_suspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`${action === 'suspend' ? 'Suspend' : 'Reinstate'} user "${user.email}"?`)) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !user.is_suspended })
        .eq('id', user.id);
      if (error) throw error;
      await logActivity(myEmail, 'user_suspend', `${action === 'suspend' ? 'Suspended' : 'Reinstated'} user "${user.email}"`);
      toast.success(`✅ User ${action === 'suspend' ? 'suspended' : 'reinstated'} successfully!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to update user: ${err.message}`);
    }
  };

  // ── Change Role ──────────────────────────────────────────────────────────
  const handleRoleChange = async (user: any, newRoleVal: Role) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRoleVal })
        .eq('id', user.id);
      if (error) throw error;
      await logActivity(myEmail, 'user_role_change', `Changed "${user.email}" role from "${user.role}" to "${newRoleVal}"`);
      toast.success(`✅ Role updated to "${newRoleVal}"!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to update role: ${err.message}`);
    }
  };

  // ── Delete User ──────────────────────────────────────────────────────────
  const handleDelete = async (user: any) => {
    if (user.email === 'shrey@tgpcopconcil.com') {
      toast.error('❌ Cannot delete the Super Admin account!');
      return;
    }
    if (!window.confirm(`Permanently delete user "${user.email}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.rpc('delete_user', { target_user_id: user.id });
      if (error) throw error;
      await logActivity(myEmail, 'user_delete', `Permanently deleted user "${user.email}"`);
      toast.success(`✅ User "${user.email}" permanently removed!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to delete user: ${err.message}`);
    }
  };

  // ── Reset Password ───────────────────────────────────────────────────────
  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPw || resetPw.length < 8) {
      toast.warning('⚠️ New password must be at least 8 characters.');
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.rpc('reset_user_password', {
        target_user_id: resetTarget.id,
        new_password: resetPw,
      });
      if (error) throw error;
      await logActivity(myEmail, 'user_pw_reset', `Reset password for "${resetTarget.email}"`);
      toast.success(`✅ Password reset for "${resetTarget.email}"!`);
      setResetTarget(null);
      setResetPw('');
    } catch (err: any) {
      toast.error(`❌ Failed to reset password: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-navy-dark">User Administration</h3>
            <p className="text-[10px] text-navy-dark/45 font-sans leading-none mt-0.5">Create, suspend, and manage portal accounts & roles.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-display text-xs font-bold shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-navy-dark/40">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="font-display text-sm">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-dark/[0.03] border-b border-navy-dark/5">
                <tr>
                  {['Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-navy-dark/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-dark/5">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-navy-dark/[0.01] transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-display font-semibold text-sm text-navy-dark">{user.email}</span>
                        {user.email === 'shrey@tgpcopconcil.com' && (
                          <span className="ml-2 text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">OWNER</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {user.role === 'super_admin' ? (
                        <RoleBadge role={user.role} />
                      ) : (
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user, e.target.value as Role)}
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border bg-navy-dark/5 border-navy-dark/10 text-navy-dark outline-none cursor-pointer hover:border-orange-burnt transition-colors"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {user.is_suspended ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-navy-dark/50">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.email !== 'shrey@tgpcopconcil.com' && (
                          <>
                            <button
                              onClick={() => handleToggleSuspend(user)}
                              title={user.is_suspended ? 'Reinstate user' : 'Suspend user'}
                              className={`p-1.5 rounded-lg transition-colors ${user.is_suspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                            >
                              {user.is_suspended ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => { setResetTarget(user); setResetPw(''); }}
                              title="Reset password"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              title="Delete user"
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-16 text-navy-dark/40">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-display">No users found. Add the first one!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-navy-dark/10 overflow-hidden">
            <div className="bg-navy-dark text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm">Create New Portal User</h4>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Email Address *</label>
                <input
                  type="email" required value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="user@tgpcop.edu"
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-purple-500 outline-none text-sm font-sans text-navy-dark transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-navy-dark/15 focus:border-purple-500 outline-none text-sm font-sans text-navy-dark transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-dark/40 hover:text-navy-dark transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Assign Role *</label>
                <select
                  value={newRole} onChange={e => setNewRole(e.target.value as Role)}
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-purple-500 outline-none text-sm font-sans text-navy-dark transition-colors bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="flex space-x-3 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-lg border border-navy-dark/15 text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-display text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5">
                  {isCreating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Creating...</span></> : <><Check className="w-3.5 h-3.5" /><span>Create User</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ───────────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-navy-dark/10 overflow-hidden">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm">Reset Password</h4>
              <button onClick={() => setResetTarget(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleResetPw} className="p-6 space-y-4">
              <p className="text-xs text-navy-dark/60 font-sans">Setting new password for <strong className="text-navy-dark">{resetTarget.email}</strong>.</p>
              <div className="relative">
                <input
                  type={showResetPw ? 'text' : 'password'} required value={resetPw}
                  onChange={e => setResetPw(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-navy-dark/15 focus:border-amber-500 outline-none text-sm font-sans text-navy-dark transition-colors"
                />
                <button type="button" onClick={() => setShowResetPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-dark/40 hover:text-navy-dark">
                  {showResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-lg border border-navy-dark/15 text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isResetting} className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-display text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5">
                  {isResetting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Resetting...</span></> : <><RotateCcw className="w-3.5 h-3.5" /><span>Reset Password</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;
