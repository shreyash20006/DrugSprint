import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { Trophy, Plus, Loader2, Trash2, Edit, X, Upload } from 'lucide-react';

const CATEGORIES = ['academic', 'sports', 'cultural', 'research', 'competition'];

const CATEGORY_COLORS: Record<string, string> = {
  academic:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sports:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cultural:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  research:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  competition: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

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

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm placeholder-white/30 outline-none focus:border-orange-burnt/50 transition-all";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <Trophy className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Achievements</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">Highlight student accomplishments on the portal</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /><span>Add Achievement</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading achievements...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
          <Trophy className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/50 text-sm font-display font-bold">No achievements yet</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <th className="text-left px-5 py-4">Student</th>
                  <th className="text-left px-5 py-4">Title</th>
                  <th className="text-left px-5 py-4">Category</th>
                  <th className="text-left px-5 py-4">Year</th>
                  <th className="text-right px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map(a => (
                  <tr key={a.id} className="hover:bg-white/[0.025] transition-colors group">
                    <td className="px-5 py-4 font-display font-semibold text-white group-hover:text-orange-100 transition-colors">{a.student_name}</td>
                    <td className="px-5 py-4 text-white/65 text-xs font-sans leading-relaxed max-w-[200px]">{a.title}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-bold capitalize ${CATEGORY_COLORS[a.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {a.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs font-mono">{a.year}</td>
                    <td className="px-5 py-4 text-right space-x-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-xl hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-[#0A1428] w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-orange-burnt/20 to-transparent border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-burnt/20 rounded-lg">
                  <Trophy className="w-4 h-4 text-orange-burnt" />
                </div>
                <h4 className="font-display font-extrabold text-sm text-white">{editId ? 'Edit Achievement' : 'Add Achievement'}</h4>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={labelCls}>Student Name *</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Year *</label>
                  <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. B.Pharm III" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0A1428] capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Achievement Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Image URL (Cloudinary or Uploaded)</label>
                <div className="flex gap-2">
                  <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                  <label className="flex items-center justify-center px-4 py-2.5 bg-white/[0.05] hover:bg-orange-burnt text-white rounded-xl cursor-pointer transition-all shrink-0 text-xs font-bold font-display border border-white/10 hover:border-orange-burnt">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1.5" /><span>Upload</span></>}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              </div>
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

export default AdminAchievements;
