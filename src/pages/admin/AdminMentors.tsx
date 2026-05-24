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

  // Mentor form
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

    if (!file.type.startsWith('image/')) {
      showToast('❌ Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ File size exceeds 5MB limit.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `mentor-${Date.now()}.${fileExt}`;
      const filePath = `mentors/${fileName}`;

      const { error } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
      showToast('📷 Mentor photo uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(`❌ Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3"><Handshake className="w-6 h-6 text-orange-burnt" /><h2 className="font-display font-extrabold text-xl text-navy-dark">Mentorship</h2></div>
        <button onClick={openCreate} className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-burnt text-white font-display text-xs font-bold hover:bg-orange-burnt/90 transition-colors shadow-md">
          <Plus className="w-4 h-4" /><span>Add Mentor</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-navy-dark/5 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('mentors')} className={`px-4 py-2 rounded-lg font-display text-xs font-bold ${activeTab === 'mentors' ? 'bg-navy-dark text-white' : 'text-navy-dark/60'}`}>Mentors ({mentors.length})</button>
        <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg font-display text-xs font-bold ${activeTab === 'requests' ? 'bg-navy-dark text-white' : 'text-navy-dark/60'}`}>Requests ({requests.length})</button>
      </div>

      {isLoading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-burnt mx-auto" /></div> : activeTab === 'mentors' ? (
        mentors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-navy-dark/10"><Handshake className="w-10 h-10 text-navy-dark/15 mx-auto mb-2" /><p className="text-navy-dark/40 text-sm">No mentors yet</p></div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-dark/10 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-dark/[0.02]">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/50">
                  <th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Specialization</th>
                  <th className="text-left px-4 py-3">Year</th><th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map(m => (
                  <tr key={m.id} className="border-t border-navy-dark/5 hover:bg-orange-burnt/[0.02]">
                    <td className="px-4 py-3 font-semibold text-navy-dark">{m.name}</td>
                    <td className="px-4 py-3 text-orange-burnt text-xs font-semibold">{m.specialization}</td>
                    <td className="px-4 py-3 text-navy-dark/60">{m.year}</td>
                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${m.is_available ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>{m.is_available ? 'Available' : 'Hidden'}</span></td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => toggleAvailable(m)} className={`p-1.5 rounded-lg ${m.is_available ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`}>{m.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-navy-dark/10"><Users className="w-10 h-10 text-navy-dark/15 mx-auto mb-2" /><p className="text-navy-dark/40 text-sm">No mentor requests yet</p></div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-dark/10 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-dark/[0.02]">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/50">
                  <th className="text-left px-4 py-3">Junior</th><th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Mentor</th><th className="text-left px-4 py-3">Year</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-t border-navy-dark/5">
                    <td className="px-4 py-3 font-semibold text-navy-dark">{r.junior_name}</td>
                    <td className="px-4 py-3 text-navy-dark/70">{r.junior_email}</td>
                    <td className="px-4 py-3 text-orange-burnt font-semibold">{r.mentors?.name || '—'}</td>
                    <td className="px-4 py-3 text-navy-dark/60">{r.junior_year}</td>
                    <td className="px-4 py-3 text-navy-dark/50 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="bg-navy-dark text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm">{editId ? 'Edit Mentor' : 'Add Mentor'}</h4>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Year *</label>
                  <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="B.Pharm IV" className="w-full px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Specialization *</label>
                  <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              </div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Email *</label>
                <input type="email" value={mentorEmail} onChange={e => setMentorEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Available Time</label>
                <input type="text" value={availableTime} onChange={e => setAvailableTime(e.target.value)} placeholder="e.g. Weekends 10-12" className="w-full px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm resize-none" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Photo URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={photoUrl} 
                    onChange={e => setPhotoUrl(e.target.value)} 
                    placeholder="https://..."
                    className="flex-grow px-4 py-2 rounded-lg border border-navy-dark/15 outline-none text-sm" 
                  />
                  <label className="flex items-center justify-center px-4 py-2 bg-navy-dark hover:bg-orange-burnt text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1.5" />
                        <span>Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} className="accent-orange-burnt w-4 h-4" />
                <span className="text-sm font-sans text-navy-dark">Available for mentoring</span>
              </label>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-navy-dark/15 text-navy-dark/60 font-display text-xs font-bold">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 rounded-lg bg-orange-burnt text-white font-display text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center">
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
