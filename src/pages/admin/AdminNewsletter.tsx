import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { Newspaper, Plus, Loader2, Trash2, Edit, X, Eye, EyeOff, Upload, FileText } from 'lucide-react';

export const AdminNewsletter: React.FC = () => {
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

  const [title, setTitle] = useState('');
  const [month, setMonth] = useState('');
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([{ heading: '', content: '' }]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('newsletters').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditId(null); setTitle(''); setMonth(''); setSections([{ heading: '', content: '' }]); setPdfUrl(''); setIsPublished(false);
    setShowModal(true);
  };

  const openEdit = (n: any) => {
    setEditId(n.id); setTitle(n.title); setMonth(n.month);
    const secs = typeof n.sections === 'string' ? JSON.parse(n.sections) : (n.sections || []);
    setSections(secs.length > 0 ? secs : [{ heading: '', content: '' }]);
    setPdfUrl(n.pdf_url || ''); setIsPublished(n.is_published);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title || !month) { showToast('Title and month required', 'error'); return; }
    setIsSaving(true);
    try {
      const validSections = sections.filter(s => s.heading.trim() || s.content.trim());
      const payload = { title, month, sections: validSections, pdf_url: pdfUrl || null, is_published: isPublished };
      if (editId) {
        const { error } = await supabase.from('newsletters').update(payload).eq('id', editId);
        if (error) throw error;
        await logActivity(email, 'newsletter_update', `Updated newsletter: ${title}`);
        showToast('Newsletter updated!', 'success');
      } else {
        const { error } = await supabase.from('newsletters').insert(payload);
        if (error) throw error;
        await logActivity(email, 'newsletter_create', `Created newsletter: ${title}`);
        showToast('Newsletter created!', 'success');
      }
      setShowModal(false); fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (n: any) => {
    if (!confirm(`Delete "${n.title}"?`)) return;
    await supabase.from('newsletters').delete().eq('id', n.id);
    await logActivity(email, 'newsletter_delete', `Deleted: ${n.title}`);
    showToast('Newsletter deleted', 'success');
    fetchAll();
  };

  const togglePublish = async (n: any) => {
    await supabase.from('newsletters').update({ is_published: !n.is_published }).eq('id', n.id);
    showToast(n.is_published ? 'Unpublished' : 'Published!', 'success');
    fetchAll();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('❌ Please select a valid PDF file.', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('❌ File size exceeds 15MB limit.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `newsletter-${Date.now()}.${fileExt}`;
      const filePath = `newsletters/${fileName}`;

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

      setPdfUrl(publicUrl);
      showToast('📄 Newsletter PDF uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(`❌ Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm placeholder-white/30 outline-none focus:border-orange-burnt/50 focus:bg-white/[0.06] transition-all";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <Newspaper className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Newsletter Publisher</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">Publish council newsletters to the student portal</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Newsletter</span>
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading newsletters...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
          <Newspaper className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/50 text-sm font-display font-bold">No newsletters yet</p>
          <p className="text-white/25 text-xs font-sans mt-1">Create and publish your first council newsletter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <div key={n.id} className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-5 flex items-center justify-between hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 group">
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`p-2 rounded-xl border ${n.is_published ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <FileText className={`w-4 h-4 ${n.is_published ? 'text-emerald-400' : 'text-amber-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <h3 className="font-display font-bold text-sm text-white group-hover:text-orange-100 transition-colors truncate">{n.title}</h3>
                    <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-lg border ${n.is_published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {n.is_published ? '● Published' : '● Draft'}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs font-sans">{n.month}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 shrink-0 ml-3">
                <button
                  onClick={() => togglePublish(n)}
                  className={`p-2 rounded-xl transition-all ${n.is_published ? 'hover:bg-amber-500/10 text-amber-400/70 hover:text-amber-400' : 'hover:bg-emerald-500/10 text-emerald-400/70 hover:text-emerald-400'}`}
                  title={n.is_published ? 'Unpublish' : 'Publish'}
                >
                  {n.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(n)} className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 transition-all">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(n)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-[#0A1428] w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden border border-white/10">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-burnt/20 to-transparent border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-burnt/20 rounded-lg">
                  <Newspaper className="w-4 h-4 text-orange-burnt" />
                </div>
                <h4 className="font-display font-extrabold text-sm text-white">
                  {editId ? 'Edit Newsletter' : 'Create Newsletter'}
                </h4>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={labelCls}>Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="May 2025 Newsletter" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Month *</label>
                <input type="text" value={month} onChange={e => setMonth(e.target.value)} placeholder="May 2025" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Sections</label>
                <div className="space-y-3">
                  {sections.map((sec, i) => (
                    <div key={i} className="bg-white/[0.04] rounded-xl p-3 space-y-2 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/30">Section {i + 1}</span>
                        {sections.length > 1 && (
                          <button onClick={() => setSections(sections.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={e => { const n = [...sections]; n[i] = { ...n[i], heading: e.target.value }; setSections(n); }}
                        placeholder="Section heading"
                        className={inputCls}
                      />
                      <textarea
                        value={sec.content}
                        onChange={e => { const n = [...sections]; n[i] = { ...n[i], content: e.target.value }; setSections(n); }}
                        placeholder="Section content..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  ))}
                  <button onClick={() => setSections([...sections, { heading: '', content: '' }])} className="text-orange-burnt text-xs font-bold font-display hover:text-orange-300 transition-colors">
                    + Add Section
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>PDF URL (Cloudinary or Uploaded)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={e => setPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                  <label className="flex items-center justify-center px-4 py-2.5 bg-white/[0.05] hover:bg-orange-burnt text-white rounded-xl cursor-pointer transition-all shrink-0 text-xs font-bold font-display border border-white/10 hover:border-orange-burnt">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1.5" />
                        <span>Upload</span>
                      </>
                    )}
                    <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-orange-burnt w-4 h-4" />
                <span className="text-sm font-sans text-white/70 font-medium">Publish immediately</span>
              </label>

              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editId ? 'Update' : 'Create'}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
