import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { BarChart3, Star } from 'lucide-react';

export const AdminFeedback: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('events').select('id, name').order('name').then(({ data }) => {
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('feedback')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, [eventId]);

  const avg = items.length
    ? (items.reduce((s, f) => s + (f.rating || 0), 0) / items.length).toFixed(1)
    : '0';
  const dist = [1, 2, 3, 4, 5].map((star) => {
    const count = items.filter((f) => f.rating === star).length;
    const pct = items.length ? Math.round((count / items.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <RequirePermission permission="view_feedback">
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border">
          <BarChart3 className="w-5 h-5 text-orange-burnt" />
          <h3 className="font-display font-bold">📊 Feedback Analytics</h3>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="ml-auto px-3 py-2 border rounded-lg text-sm">
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border text-center">
            <Star className="w-6 h-6 text-orange-burnt mx-auto mb-2" />
            <p className="text-xs uppercase font-bold text-navy-dark/40">Avg Rating</p>
            <p className="font-display font-extrabold text-2xl text-navy-dark">⭐ {avg}/5</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border text-center">
            <p className="text-xs uppercase font-bold text-navy-dark/40">Total Responses</p>
            <p className="font-display font-extrabold text-2xl text-navy-dark">{items.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border space-y-3">
          <h4 className="font-display font-bold text-sm">Rating distribution</h4>
          {dist.reverse().map((d) => (
            <div key={d.star}>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{d.star}⭐</span>
                <span>{d.pct}%</span>
              </div>
              <div className="h-2 bg-navy-dark/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-burnt" style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border divide-y max-h-96 overflow-y-auto">
          {items.map((f) => (
            <div key={f.id} className="p-4 text-sm">
              <div className="flex justify-between font-semibold">
                <span>{f.name || 'Anonymous'}</span>
                <span className="text-orange-burnt">{'⭐'.repeat(f.rating)}</span>
              </div>
              {f.liked && <p className="text-navy-dark/70 mt-2"><b>Liked:</b> {f.liked}</p>}
              {f.suggestions && <p className="text-navy-dark/60 mt-1"><b>Suggestions:</b> {f.suggestions}</p>}
            </div>
          ))}
        </div>
      </div>
    </RequirePermission>
  );
};

export default AdminFeedback;
