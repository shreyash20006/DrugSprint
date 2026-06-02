import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { sendAdminNotification } from '../../lib/brevo';
import { 
  getRoleDisplayName, 
  ASSIGNABLE_ROLES, 
  type Role 
} from '../../hooks/useRole';
import {
  Users, ShieldAlert, ShieldCheck, Trash2, 
  Loader2, Search, Filter, Ban, UserPlus, X, Building2,
  Mail, ChevronDown
} from 'lucide-react';

const RoleBadgeMap: Record<Role, string> = {
  super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  developer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  president: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vice_president: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  general_secretary: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  secretary: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  treasurer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  coordinator: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  student: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => (
  <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${RoleBadgeMap[role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
    {getRoleDisplayName(role)}
  </span>
);

// Predefined workspace email suggestions for tgpcopcouncil.online
const WORKSPACE_SUGGESTIONS = [
  { email: 'developer@tgpcopcouncil.online',         role: 'developer' as Role,         label: 'Developer' },
  { email: 'president@tgpcopcouncil.online',          role: 'president' as Role,          label: 'President' },
  { email: 'vicepresident@tgpcopcouncil.online',      role: 'vice_president' as Role,     label: 'Vice President' },
  { email: 'general-secretary@tgpcopcouncil.online',  role: 'general_secretary' as Role,  label: 'General Secretary' },
  { email: 'secretary@tgpcopcouncil.online',          role: 'secretary' as Role,          label: 'Secretary' },
  { email: 'treasurer@tgpcopcouncil.online',          role: 'treasurer' as Role,          label: 'Treasurer' },
  { email: 'events-coordinator@tgpcopcouncil.online', role: 'coordinator' as Role,        label: 'Events Coordinator' },
  { email: 'cultural-secretary@tgpcopcouncil.online', role: 'coordinator' as Role,        label: 'Cultural Secretary' },
  { email: 'nss-incharge@tgpcopcouncil.online',       role: 'coordinator' as Role,        label: 'NSS Incharge' },
  { email: 'admin@tgpcopcouncil.online',              role: 'admin' as Role,              label: 'Admin' },
];

export const AdminUsers: React.FC = () => {
  const { email: myEmail, role: myRole, userId: myUserId } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [preAuthorized, setPreAuthorized] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Add Workspace User modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('developer');
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, preAuthRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('pre_authorized_emails').select('*').eq('is_used', false).order('created_at', { ascending: false }),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      setUsers(profilesRes.data || []);
      setFilteredUsers(profilesRes.data || []);
      setPreAuthorized(preAuthRes.data || []);
    } catch (err: any) {
      toast.error('❌ Failed to load users: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = [...users];
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.full_name && u.full_name.toLowerCase().includes(query))
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  // ── Add Workspace / Pre-authorize User ──────────────────────────────────────
  const handleAddWorkspaceUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('❌ Please enter an email address.');
      return;
    }

    const emailLower = newEmail.trim().toLowerCase();

    // Check both profiles and pre_authorized_emails
    const existsInProfiles = users.find(u => u.email?.toLowerCase() === emailLower);
    const existsInPreAuth  = preAuthorized.find(u => u.email?.toLowerCase() === emailLower);

    if (existsInProfiles) {
      toast.warning(`⚠️ "${emailLower}" already exists as an active user with role: ${getRoleDisplayName(existsInProfiles.role)}`);
      return;
    }
    if (existsInPreAuth) {
      toast.warning(`⚠️ "${emailLower}" is already pending authorization.`);
      return;
    }

    setIsAdding(true);
    try {
      // Insert into pre_authorized_emails — no FK constraint here
      // When user logs in via Google OAuth, handle_new_user trigger reads this table
      const { error } = await supabase
        .from('pre_authorized_emails')
        .insert({
          email:     emailLower,
          role:      newRole,
          full_name: newName.trim() || getRoleDisplayName(newRole),
          added_by:  myEmail,
        });

      if (error) throw error;

      await logActivity(myEmail, 'user_preauthorize', `Pre-authorized "${emailLower}" with role="${newRole}"`);

      await sendAdminNotification({
        subject: '👤 New Workspace User Pre-authorized',
        title: 'User Pre-Authorization',
        bodyHtml: `<p><b>Email:</b> ${emailLower}</p><p><b>Role:</b> ${getRoleDisplayName(newRole)}</p><p><b>Added by:</b> ${myEmail}</p><p>This user can now sign in via Google OAuth and will receive their role automatically.</p>`,
      });

      toast.success(`✅ "${emailLower}" pre-authorized as ${getRoleDisplayName(newRole)}! They can now sign in with Google.`);
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
      setNewRole('developer');
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to add user: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  // ── Delete Pre-authorized entry ───────────────────────────────────────────
  const handleDeletePreAuth = async (entry: any) => {
    if (!window.confirm(`Remove pre-authorization for "${entry.email}"?`)) return;
    try {
      const { error } = await supabase.from('pre_authorized_emails').delete().eq('id', entry.id);
      if (error) throw error;
      toast.success(`✅ Removed pre-authorization for "${entry.email}"`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const applySuggestion = (s: typeof WORKSPACE_SUGGESTIONS[0]) => {
    setNewEmail(s.email);
    setNewRole(s.role);
    setNewName(s.label);
    setShowSuggestions(false);
  };

  // ── Toggle Suspension (is_active) ──────────────────────────────────────────
  const handleToggleActive = async (user: any) => {
    const nextActiveState = !user.is_active;
    const actionName = nextActiveState ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionName} user "${user.email}"?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: nextActiveState, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;

      await logActivity(myEmail, 'user_active_toggle', `${nextActiveState ? 'Reactivated' : 'Suspended'} user "${user.email}"`);
      await sendAdminNotification({
        subject: `👤 User Account ${nextActiveState ? 'Reactivated' : 'Suspended'}`,
        title: 'Roster Account Status Modification',
        bodyHtml: `<p><b>User:</b> ${user.email}</p><p><b>Status:</b> ${nextActiveState ? 'ACTIVE' : 'SUSPENDED'}</p><p>Modified by: ${myEmail}</p>`,
      });

      toast.success(`✅ User account ${nextActiveState ? 'reactivated' : 'suspended'} successfully.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to update status: ${err.message}`);
    }
  };

  // ── Change Role Instantly ──────────────────────────────────────────────────
  const handleRoleChange = async (user: any, newRoleVal: Role) => {
    if (newRoleVal === 'super_admin' && myRole !== 'super_admin' && myRole !== 'developer') {
      toast.error('❌ Only Super Administrators can assign the Super Admin role.');
      return;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRoleVal, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;

      await logActivity(myEmail, 'user_role_change', `Changed "${user.email}" role from "${user.role}" to "${newRoleVal}"`);
      await sendAdminNotification({
        subject: '👤 Roster Role Classification Modification',
        title: 'User Role Updated',
        bodyHtml: `<p><b>User:</b> ${user.email}</p><p><b>New Role:</b> ${getRoleDisplayName(newRoleVal)}</p><p>Modified by: ${myEmail}</p>`,
      });

      toast.success(`✅ Role updated to "${getRoleDisplayName(newRoleVal)}"`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to update role: ${err.message}`);
    }
  };

  // ── Delete User Profile ───────────────────────────────────────────────────
  const handleDelete = async (user: any) => {
    if (user.role === 'super_admin') {
      toast.error('❌ Cannot delete Super Admin accounts.');
      return;
    }
    if (!window.confirm(`Permanently delete user profile "${user.email}"? This action is irreversible.`)) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      try { await supabase.rpc('delete_user', { target_user_id: user.id }); } catch (_) {}
      await logActivity(myEmail, 'user_delete', `Permanently deleted profile "${user.email}"`);
      toast.success(`✅ User profile "${user.email}" permanently removed.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`❌ Failed to delete profile: ${err.message}`);
    }
  };

  const filteredSuggestions = WORKSPACE_SUGGESTIONS.filter(
    s => !users.some(u => u.email?.toLowerCase() === s.email)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page Header */}
      <div className="flex items-center justify-between bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wide">
              User Management
            </h3>
            <p className="text-[10px] text-navy-dark/45 font-sans leading-none mt-0.5 uppercase tracking-wider font-semibold">
              Manage accounts, assign roles, and handle council authorization.
            </p>
          </div>
        </div>

        {/* Add Workspace User Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Workspace User</span>
        </button>
      </div>

      {/* Workspace Users Info Banner */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-start space-x-3">
        <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-display font-bold text-indigo-400 uppercase tracking-wider">Google Workspace Integration</p>
          <p className="text-xs text-navy-dark/60 font-sans mt-0.5 leading-relaxed">
            Pre-authorize workspace emails (<span className="font-mono text-indigo-500">@tgpcopcouncil.online</span>) or any Gmail account here. 
            When they sign in with Google for the first time, their role is automatically applied.
          </p>
        </div>
      </div>

      {/* Pending Pre-Authorized Users */}
      {preAuthorized.length > 0 && (
        <div className="bg-white border border-amber-400/30 rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-amber-400/5 border-b border-amber-400/20">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-display font-extrabold text-amber-600 uppercase tracking-widest">
                Pending Authorization — Awaiting First Login
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {preAuthorized.length} pending
            </span>
          </div>
          <div className="divide-y divide-amber-400/10">
            {preAuthorized.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-600 font-display font-bold text-xs shrink-0">
                    {entry.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <span className="block font-display font-bold text-sm text-navy-dark">{entry.full_name}</span>
                    <span className="block text-[10px] font-mono text-navy-dark/50">{entry.email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${RoleBadgeMap[entry.role as Role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {getRoleDisplayName(entry.role)}
                  </span>
                  <span className="text-[9px] text-amber-500 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">⏳ Awaiting Login</span>
                  <button
                    onClick={() => handleDeletePreAuth(entry)}
                    title="Remove pre-authorization"
                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white border border-navy-dark/10 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-dark/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by email or full name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-dark/10 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/10 outline-none text-xs font-sans text-navy-dark transition-all bg-[#050B18]/[0.02]"
          />
        </div>
        <div className="w-full md:w-64 relative flex items-center">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-dark/40" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-navy-dark/10 focus:border-orange-burnt outline-none text-xs font-display font-bold uppercase tracking-wider text-navy-dark/70 bg-[#050B18]/[0.02] appearance-none cursor-pointer"
          >
            <option value="all">Filter by Role (All)</option>
            {ASSIGNABLE_ROLES.map(r => (
              <option key={r} value={r}>{getRoleDisplayName(r)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-navy-dark/45 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-burnt" />
            <span className="font-display text-xs uppercase tracking-widest font-bold">Fetching Roster Profiles...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-dark/[0.03] border-b border-navy-dark/5">
                <tr>
                  {['Student Profile / Email', 'Assigned Role', 'Account Status', 'Registration Date', 'Access Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-navy-dark/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-dark/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-navy-dark/[0.01] transition-colors select-none">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || 'avatar'} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center text-orange-burnt font-display font-bold text-xs shrink-0">
                            {user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block font-display font-bold text-sm text-navy-dark leading-tight truncate">
                            {user.full_name || 'Unregistered'}
                          </span>
                          <span className="block text-[10px] text-navy-dark/50 font-sans mt-0.5 truncate font-semibold">
                            {user.email}
                          </span>
                          {/* Workspace badge */}
                          {user.email?.includes('@tgpcopcouncil.online') && (
                            <span className="inline-flex items-center space-x-1 text-[8px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full mt-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              <span>Workspace</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {user.role === 'super_admin' && myRole !== 'super_admin' ? (
                        <RoleBadge role={user.role} />
                      ) : (
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user, e.target.value as Role)}
                          className="text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border bg-[#050B18]/[0.02] border-navy-dark/10 text-navy-dark/85 outline-none cursor-pointer hover:border-orange-burnt transition-colors"
                        >
                          {ASSIGNABLE_ROLES.map(r => (
                            <option key={r} value={r} className="bg-white text-navy-dark normal-case">{getRoleDisplayName(r)}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-navy-dark/50 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.id !== myUserId && user.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleToggleActive(user)}
                              title={user.is_active ? 'Suspend Account' : 'Reactivate Account'}
                              className={`p-2 rounded-xl transition-all border cursor-pointer hover:scale-105 active:scale-95 ${user.is_active ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'}`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              title="Delete Profile"
                              className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
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

            {filteredUsers.length === 0 && (
              <div className="text-center py-20 text-navy-dark/40 flex flex-col items-center">
                <Users className="w-12 h-12 mb-3 opacity-30 text-orange-burnt animate-pulse" />
                <p className="font-display text-sm font-bold uppercase tracking-wider">No matching roster users found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Workspace User Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-dark/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-orange-burnt/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-orange-burnt" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-navy-dark">Add Workspace User</h3>
                  <p className="text-[10px] text-navy-dark/50 font-sans">Pre-authorize for Google OAuth login</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setShowSuggestions(false); }}
                className="p-2 rounded-xl hover:bg-navy-dark/5 text-navy-dark/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorkspaceUser} className="p-6 space-y-4">

              {/* Quick Suggestions */}
              <div>
                <label className="block text-[10px] text-navy-dark/50 font-bold uppercase tracking-wider mb-2">
                  Quick Select — Workspace Emails
                </label>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-navy-dark/10 hover:border-orange-burnt text-xs font-display font-bold text-navy-dark/70 transition-colors bg-navy-dark/[0.02]"
                >
                  <span className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Select a @tgpcopcouncil.online email...</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                </button>

                {showSuggestions && (
                  <div className="mt-1 border border-navy-dark/10 rounded-xl overflow-hidden shadow-lg bg-white">
                    {filteredSuggestions.length === 0 ? (
                      <p className="text-center text-xs text-navy-dark/40 py-4 font-display">All workspace emails already added ✓</p>
                    ) : (
                      filteredSuggestions.map(s => (
                        <button
                          key={s.email}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-burnt/5 transition-colors border-b border-navy-dark/5 last:border-0 text-left"
                        >
                          <div>
                            <span className="block text-xs font-display font-bold text-navy-dark">{s.label}</span>
                            <span className="block text-[10px] font-mono text-navy-dark/50">{s.email}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${RoleBadgeMap[s.role]}`}>
                            {getRoleDisplayName(s.role)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-navy-dark/5 pt-4 space-y-4">
                <p className="text-[10px] text-navy-dark/40 font-semibold uppercase tracking-wider">— Or enter manually —</p>

                {/* Email */}
                <div>
                  <label className="block text-[10px] text-navy-dark/50 font-bold uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-dark/30" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="developer@tgpcopcouncil.online"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-dark/10 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/10 outline-none text-xs font-sans text-navy-dark transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[10px] text-navy-dark/50 font-bold uppercase tracking-wider mb-1.5">
                    Display Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Developer"
                    className="w-full px-4 py-2.5 rounded-xl border border-navy-dark/10 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/10 outline-none text-xs font-sans text-navy-dark transition-all"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] text-navy-dark/50 font-bold uppercase tracking-wider mb-1.5">
                    Assign Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as Role)}
                    className="w-full px-4 py-2.5 rounded-xl border border-navy-dark/10 focus:border-orange-burnt outline-none text-xs font-display font-bold uppercase tracking-wider text-navy-dark/85 cursor-pointer"
                  >
                    {ASSIGNABLE_ROLES.filter(r => r !== 'student').map(r => (
                      <option key={r} value={r} className="bg-white text-navy-dark normal-case">
                        {getRoleDisplayName(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-[10px] text-blue-600 font-sans leading-relaxed">
                💡 <strong>How it works:</strong> This pre-authorizes the email with the selected role. When the user signs in with <strong>Google OAuth</strong>, their role is automatically applied and they'll be redirected to the correct dashboard.
              </div>

              {/* Submit */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowSuggestions(false); }}
                  className="flex-1 py-2.5 rounded-xl border border-navy-dark/10 text-xs font-display font-bold text-navy-dark/60 hover:bg-navy-dark/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display font-bold text-xs transition-all shadow-sm active:scale-98 disabled:opacity-60"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isAdding ? 'Adding...' : 'Add & Authorize'}</span>
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
