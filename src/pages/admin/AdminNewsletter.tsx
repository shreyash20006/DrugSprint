import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { Newspaper, Plus, Loader2, Trash2, Edit, X, Eye, EyeOff, Upload } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3"><Newspaper className="w-6 h-6 text-orange-burnt" /><h2 className="font-display font-extrabold text-xl text-navy-dark">Newsletters</h2></div>
        <button onClick={openCreate} className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-burnt text-white font-display text-xs font-bold hover:bg-orange-burnt/90 transition-colors shadow-md">
          <Plus className="w-4 h-4" /><span>Create Newsletter</span>
        </button>
      </div>

      {isLoading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-burnt mx-auto" /></div> : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-navy-dark/10"><Newspaper className="w-10 h-10 text-navy-dark/15 mx-auto mb-2" /><p className="text-navy-dark/40 text-sm">No newsletters yet</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-navy-dark/10 shadow-sm p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-0.5">
                  <h3 className="font-display font-bold text-sm text-navy-dark">{n.title}</h3>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${n.is_published ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {n.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-navy-dark/50 text-xs">{n.month}</p>
              </div>
              <div className="flex items-center space-x-1.5">
                <button onClick={() => togglePublish(n)} className={`p-1.5 rounded-lg transition-colors ${n.is_published ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-emerald-50 text-emerald-500'}`} title={n.is_published ? 'Unpublish' : 'Publish'}>
                  {n.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(n)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(n)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="bg-navy-dark text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm">{editId ? 'Edit Newsletter' : 'Create Newsletter'}</h4>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="May 2025 Newsletter" className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Month *</label>
                <input type="text" value={month} onChange={e => setMonth(e.target.value)} placeholder="May 2025" className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 outline-none text-sm" /></div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Sections</label>
                <div className="space-y-3">
                  {sections.map((sec, i) => (
                    <div key={i} className="bg-navy-dark/[0.02] rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-navy-dark/40">Section {i + 1}</span>
                        {sections.length > 1 && <button onClick={() => setSections(sections.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>}
                      </div>
                      <input type="text" value={sec.heading} onChange={e => { const n = [...sections]; n[i] = { ...n[i], heading: e.target.value }; setSections(n); }}
                        placeholder="Section heading" className="w-full px-3 py-2 rounded-lg border border-navy-dark/10 outline-none text-sm" />
                      <textarea value={sec.content} onChange={e => { const n = [...sections]; n[i] = { ...n[i], content: e.target.value }; setSections(n); }}
                        placeholder="Section content..." rows={3} className="w-full px-3 py-2 rounded-lg border border-navy-dark/10 outline-none text-sm resize-none" />
                    </div>
                  ))}
                  <button onClick={() => setSections([...sections, { heading: '', content: '' }])} className="text-orange-burnt text-xs font-bold font-display hover:underline">+ Add Section</button>
                </div>
              </div>

              <div><label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">PDF URL (Cloudinary or Uploaded)</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={pdfUrl} 
                    onChange={e => setPdfUrl(e.target.value)} 
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
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-orange-burnt w-4 h-4" />
                <span className="text-sm font-sans text-navy-dark font-medium">Publish immediately</span>
              </label>

              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-navy-dark/15 text-navy-dark/60 font-display text-xs font-bold">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 rounded-lg bg-orange-burnt text-white font-display text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center">
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
