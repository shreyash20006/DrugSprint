import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { Handshake, Plus, Loader2, Trash2, Edit, X, Eye, EyeOff, Users, Upload } from 'lucide-react';

export const AdminMentors: React.FC = () => {
  const toast = useToast();
  const showToast = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };
  const { email } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentors' | 'requests'>('mentors');

  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);
    const [{ data: m }, { data: r }] = await Promise.all([
      supabase.from('mentors').select('*').order('created_at', { ascending: false }),
      supabase.from('mentor_requests').select('*, mentors(name)').order('created_at', { ascending: false }),
    ]);
    setMentors(m || []);
    setRequests(r || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditId(null); setName(''); setYear(''); setSpecialization(''); setAvailableTime('');
    setMentorEmail(''); setBio(''); setPhotoUrl(''); setIsAvailable(true);
    setShowModal(true);
  };

  const openEdit = (m: any) => {
    setEditId(m.id); setName(m.name); setYear(m.year); setSpecialization(m.specialization);
    setAvailableTime(m.available_time || ''); setMentorEmail(m.email); setBio(m.bio || '');
    setPhotoUrl(m.photo_url || ''); setIsAvailable(m.is_available);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !year || !specialization || !mentorEmail) { showToast('Name, year, specialization, and email required', 'error'); return; }
    setIsSaving(true);
    try {
      const payload = { name, year, specialization, available_time: availableTime || null, email: mentorEmail, bio: bio || null, photo_url: photoUrl || null, is_available: isAvailable };
      if (editId) {
        const { error } = await supabase.from('mentors').update(payload).eq('id', editId);
        if (error) throw error;
        await logActivity(email, 'mentor_update', `Updated mentor: ${name}`);
        showToast('Mentor updated!', 'success');
      } else {
        const { error } = await supabase.from('mentors').insert(payload);
        if (error) throw error;
        await logActivity(email, 'mentor_create', `Added mentor: ${name}`);
        showToast('Mentor added!', 'success');
      }
      setShowModal(false); fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (m: any) => {
    if (!confirm(`Delete mentor "${m.name}"?`)) return;
    await supabase.from('mentors').delete().eq('id', m.id);
    await logActivity(email, 'mentor_delete', `Deleted: ${m.name}`);
    showToast('Mentor deleted', 'success');
    fetchAll();
  };

  const toggleAvailable = async (m: any) => {
    await supabase.from('mentors').update({ is_available: !m.is_available }).eq('id', m.id);
    showToast(m.is_available ? 'Mentor hidden' : 'Mentor visible', 'success');
    fetchAll();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('❌ Please select a valid image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('❌ File size exceeds 5MB limit.', 'error'); return; }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `mentor-${Date.now()}.${fileExt}`;
      const filePath = `mentors/${fileName}`;
      const { error } = await supabase.storage.from('branding').upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(filePath);
      setPhotoUrl(publicUrl);
      showToast('📷 Mentor photo uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(`❌ Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm placeholder-white/30 outline-none focus:border-orange-burnt/50 transition-all";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5";

  const tableHeaderCls = "border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-white/40";
  const tableCls = "bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <Handshake className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Mentorship</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">Manage mentors and review student requests</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all shadow-md">
          <Plus className="w-4 h-4" /><span>Add Mentor</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/[0.04] p-1 rounded-xl w-fit border border-white/10">
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all ${activeTab === 'mentors' ? 'bg-orange-burnt text-white shadow-md' : 'text-white/50 hover:text-white'}`}
        >
          Mentors ({mentors.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-orange-burnt text-white shadow-md' : 'text-white/50 hover:text-white'}`}
        >
          Requests ({requests.length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading...</p>
        </div>
      ) : activeTab === 'mentors' ? (
        mentors.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
            <Handshake className="w-12 h-12 text-white/10 mb-3" />
            <p className="text-white/50 text-sm font-display font-bold">No mentors yet</p>
          </div>
        ) : (
          <div className={tableCls}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={tableHeaderCls}>
                  <th className="text-left px-5 py-4">Name</th>
                  <th className="text-left px-5 py-4">Specialization</th>
                  <th className="text-left px-5 py-4">Year</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-right px-5 py-4">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {mentors.map(m => (
                    <tr key={m.id} className="hover:bg-white/[0.025] transition-colors group">
                      <td className="px-5 py-4 font-display font-semibold text-white group-hover:text-orange-100 transition-colors">{m.name}</td>
                      <td className="px-5 py-4 text-orange-burnt/80 text-xs font-semibold">{m.specialization}</td>
                      <td className="px-5 py-4 text-white/45 text-xs font-mono">{m.year}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-lg border ${m.is_available ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {m.is_available ? 'Available' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <button onClick={() => toggleAvailable(m)} className={`p-1.5 rounded-xl transition-all ${m.is_available ? 'hover:bg-red-500/10 text-red-400/70 hover:text-red-400' : 'hover:bg-emerald-500/10 text-emerald-400/70 hover:text-emerald-400'}`}>
                          {m.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-xl hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 transition-all"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(m)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
            <Users className="w-12 h-12 text-white/10 mb-3" />
            <p className="text-white/50 text-sm font-display font-bold">No mentor requests yet</p>
          </div>
        ) : (
          <div className={tableCls}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={tableHeaderCls}>
                  <th className="text-left px-5 py-4">Junior</th>
                  <th className="text-left px-5 py-4">Email</th>
                  <th className="text-left px-5 py-4">Mentor</th>
                  <th className="text-left px-5 py-4">Year</th>
                  <th className="text-left px-5 py-4">Date</th>
                </tr></thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-4 font-display font-semibold text-white">{r.junior_name}</td>
                      <td className="px-5 py-4 text-white/55 text-xs font-mono">{r.junior_email}</td>
                      <td className="px-5 py-4 text-orange-burnt/80 font-semibold text-xs">{r.mentors?.name || '—'}</td>
                      <td className="px-5 py-4 text-white/40 text-xs font-mono">{r.junior_year}</td>
                      <td className="px-5 py-4 text-white/35 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-[#0A1428] w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-orange-burnt/20 to-transparent border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-burnt/20 rounded-lg"><Handshake className="w-4 h-4 text-orange-burnt" /></div>
                <h4 className="font-display font-extrabold text-sm text-white">{editId ? 'Edit Mentor' : 'Add Mentor'}</h4>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              <div><label className={labelCls}>Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Year *</label><input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="B.Pharm IV" className={inputCls} /></div>
                <div><label className={labelCls}>Specialization *</label><input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Email *</label><input type="email" value={mentorEmail} onChange={e => setMentorEmail(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Available Time</label><input type="text" value={availableTime} onChange={e => setAvailableTime(e.target.value)} placeholder="e.g. Weekends 10-12" className={inputCls} /></div>
              <div><label className={labelCls}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Photo URL</label>
                <div className="flex gap-2">
                  <input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                  <label className="flex items-center justify-center px-4 py-2.5 bg-white/[0.05] hover:bg-orange-burnt text-white rounded-xl cursor-pointer transition-all shrink-0 text-xs font-bold font-display border border-white/10 hover:border-orange-burnt">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1.5" /><span>Upload</span></>}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} className="accent-orange-burnt w-4 h-4" />
                <span className="text-sm font-sans text-white/70">Available for mentoring</span>
              </label>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editId ? 'Update' : 'Add'}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMentors;
