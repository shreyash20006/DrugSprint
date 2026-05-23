import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { useToast } from '../../components/admin/Toast';
import { Newspaper, Plus } from 'lucide-react';

interface Section { heading: string; content: string }

export const AdminNewsletter: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    month: '',
    pdf_url: '',
    is_published: false,
    sections: [{ heading: 'Events Recap', content: '' }] as Section[],
  });
  const [preview, setPreview] = useState(false);

  const load = () =>
    supabase.from('newsletters').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []));

  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabase.from('newsletters').insert([
      {
        title: form.title,
        month: form.month,
        pdf_url: form.pdf_url || null,
        is_published: form.is_published,
        content: form.sections,
      },
    ]);
    toast.success('Newsletter created');
    load();
  };

  const togglePublish = async (n: any) => {
    await supabase.from('newsletters').update({ is_published: !n.is_published }).eq('id', n.id);
    load();
  };

  return (
    <RequirePermission permission="manage_newsletter">
      <div className="space-y-6 max-w-3xl">
        <h3 className="font-display font-bold flex items-center gap-2 bg-white p-5 rounded-2xl border">
          <Newspaper className="w-5 h-5 text-orange-burnt" /> 📰 Newsletter
        </h3>
        <div className="bg-white p-5 rounded-2xl border space-y-3">
          <h4 className="font-bold text-sm">➕ Create Newsletter</h4>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Month (e.g. May 2025)" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          {form.sections.map((s, i) => (
            <div key={i} className="border p-3 rounded-lg space-y-2">
              <input placeholder="Section heading" value={s.heading} onChange={(e) => {
                const sections = [...form.sections];
                sections[i] = { ...sections[i], heading: e.target.value };
                setForm({ ...form, sections });
              }} className="w-full px-2 py-1.5 border rounded text-sm" />
              <textarea placeholder="Content" value={s.content} onChange={(e) => {
                const sections = [...form.sections];
                sections[i] = { ...sections[i], content: e.target.value };
                setForm({ ...form, sections });
              }} className="w-full px-2 py-1.5 border rounded text-sm" rows={2} />
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, sections: [...form.sections, { heading: '', content: '' }] })} className="text-xs font-bold text-orange-burnt">+ Add Section</button>
          <input placeholder="PDF URL (optional)" value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Publish
          </label>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)} className="flex-1 py-2 border rounded-lg text-sm font-bold">Preview</button>
            <button onClick={save} className="flex-1 py-2 bg-orange-burnt text-white rounded-lg text-sm font-bold">Save</button>
          </div>
          {preview && (
            <div className="border-t pt-4 space-y-2">
              <h5 className="font-bold">{form.month || form.title}</h5>
              {form.sections.map((s, i) => (
                <div key={i}><b>{s.heading}</b><p className="text-sm">{s.content}</p></div>
              ))}
            </div>
          )}
        </div>
        {items.map((n) => (
          <div key={n.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
            <div>
              <p className="font-bold">{n.month || n.title}</p>
              <span className={`text-[10px] font-bold uppercase ${n.is_published ? 'text-emerald-600' : 'text-navy-dark/40'}`}>
                {n.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <button onClick={() => togglePublish(n)} className="text-xs font-bold text-orange-burnt">
              {n.is_published ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        ))}
      </div>
    </RequirePermission>
  );
};

export default AdminNewsletter;
