import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { Trophy, Plus, Loader2, Trash2, Edit, X, Upload } from 'lucide-react';

const CATEGORIES = ['academic', 'sports', 'cultural', 'research', 'competition'];

export const AdminAchievements: React.FC = () => {
  const toast = useToast();
  const showToast = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };
  const { email } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('academic');
  const [imageUrl, setImageUrl] = useState('');

  const fetchAll = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('achievements').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditId(null); setStudentName(''); setYear(''); setTitle(''); setDescription(''); setCategory('academic'); setImageUrl('');
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditId(a.id); setStudentName(a.student_name); setYear(a.year); setTitle(a.title);
    setDescription(a.description || ''); setCategory(a.category); setImageUrl(a.image_url || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!studentName || !year || !title) { showToast('Name, year, and title required', 'error'); return; }
    setIsSaving(true);
    try {
      const payload = { student_name: studentName, year, title, description, category, image_url: imageUrl || null };
      if (editId) {
        const { error } = await supabase.from('achievements').update(payload).eq('id', editId);
        if (error) throw error;
        await logActivity(email, 'achievement_update', `Updated achievement: ${title}`);
        showToast('Achievement updated!', 'success');
      } else {
        const { error } = await supabase.from('achievements').insert(payload);
        if (error) throw error;
        await logActivity(email, 'achievement_create', `Created achievement: ${title}`);
        showToast('Achievement added!', 'success');
      }
      setShowModal(false); fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (a: any) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await supabase.from('achievements').delete().eq('id', a.id);
    await logActivity(email, 'achievement_delete', `Deleted: ${a.title}`);
    showToast('Achievement deleted', 'success');
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
      const fileName = `achievement-${Date.now()}.${fileExt}`;
      const filePath = `achievements/${fileName}`;

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

      setImageUrl(publicUrl);
      showToast('📷 Image uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(`❌ Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3"><Trophy className="w-6 h-6 text-orange-burnt" /><h2 className="font-display font-extrabold text-xl text-navy-dark">Achievements</h2></div>
        <button onClick={openCreate} className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-burnt text-white font-display text-xs font-bold hover:bg-orange-burnt/90 transition-colors shadow-md">
          <Plus className="w-4 h-4" /><span>Add Achievement</span>
        </button>
      </div>

      {isLoading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-burnt mx-auto" /></div> : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-navy-dark/10"><Trophy className="w-10 h-10 text-navy-dark/15 mx-auto mb-2" /><p className="text-navy-dark/40 text-sm">No achievements yet</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-navy-dark/10 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-dark/[0.02]">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/50">
                <th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Year</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-t border-navy-dark/5 hover:bg-orange-burnt/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy-dark">{a.student_name}</td>
                  <td className="px-4 py-3 text-navy-dark/70">{a.title}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold capitalize">{a.category}</span></td>
                  <td className="px-4 py-3 text-navy-dark/60">{a.year}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="bg-navy-dark text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm">{editId ? 'Edit Achievement' : 'Add Achievement'}</h4>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Student Name *</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Year *</label>
                  <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. B.Pharm III" className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm bg-white capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Achievement Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm resize-none" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Image URL (Cloudinary or Uploaded)</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    placeholder="https://..."
                    className="flex-grow px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm" 
                  />
                  <label className="flex items-center justify-center px-4 py-2.5 bg-navy-dark hover:bg-orange-burnt text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
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

export default AdminAchievements;
