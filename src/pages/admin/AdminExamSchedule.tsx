import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ExamSchedule {
  id: string;
  subject_name: string;
  subject_code: string;
  semester: string;
  year: string;
  exam_date: string;
  exam_time: string;
  exam_type: 'Regular' | 'Supplementary';
  status: 'Scheduled' | 'Postponed' | 'Completed' | 'Cancelled';
  notes?: string;
  created_at: string;
}

const EMPTY_FORM: Omit<ExamSchedule, 'id' | 'created_at'> = {
  subject_name: '',
  subject_code: '',
  semester: '',
  year: '',
  exam_date: '',
  exam_time: '10:00',
  exam_type: 'Regular',
  status: 'Scheduled',
  notes: '',
};

const SEMESTERS = ['Sem I', 'Sem II', 'Sem III', 'Sem IV', 'Sem V', 'Sem VI', 'Sem VII', 'Sem VIII'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year (Final)'];
const EXAM_TYPES: ExamSchedule['exam_type'][] = ['Regular', 'Supplementary'];
const STATUSES: ExamSchedule['status'][] = ['Scheduled', 'Postponed', 'Completed', 'Cancelled'];

const STATUS_STYLES: Record<ExamSchedule['status'], string> = {
  Scheduled:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Postponed:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Completed:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Cancelled:    'bg-red-500/15 text-red-400 border-red-500/30',
};

const TYPE_STYLES: Record<ExamSchedule['exam_type'], string> = {
  Regular:        'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Supplementary:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdminExamSchedule: React.FC = () => {
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ── Fetch ──
  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select('*')
        .order('exam_date', { ascending: true });
      if (error) throw error;
      setExams(data || []);
    } catch (err: any) {
      setError('Failed to load exam schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const showAlert = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); }
    else                    { setError(msg);   setTimeout(() => setError(''), 4000);   }
  };

  // ── Open modal ──
  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (exam: ExamSchedule) => {
    setEditId(exam.id);
    setForm({
      subject_name: exam.subject_name,
      subject_code: exam.subject_code,
      semester:     exam.semester,
      year:         exam.year,
      exam_date:    exam.exam_date,
      exam_time:    exam.exam_time,
      exam_type:    exam.exam_type,
      status:       exam.status,
      notes:        exam.notes || '',
    });
    setShowModal(true);
  };

  // ── Save ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject_name.trim() || !form.exam_date || !form.semester || !form.year) {
      showAlert('Please fill all required fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        subject_name: form.subject_name.trim(),
        subject_code: form.subject_code.trim(),
        semester:     form.semester,
        year:         form.year,
        exam_date:    form.exam_date,
        exam_time:    form.exam_time,
        exam_type:    form.exam_type,
        status:       form.status,
        notes:        form.notes?.trim() || null,
      };

      if (editId) {
        const { error } = await supabase.from('exam_schedules').update(payload).eq('id', editId);
        if (error) throw error;
        showAlert('✅ Exam schedule updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('exam_schedules').insert(payload);
        if (error) throw error;
        showAlert('✅ Exam added to schedule!', 'success');
      }
      setShowModal(false);
      fetchExams();
    } catch (err: any) {
      showAlert('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from schedule? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('exam_schedules').delete().eq('id', id);
      if (error) throw error;
      showAlert('Exam removed from schedule.', 'success');
      fetchExams();
    } catch (err: any) {
      showAlert('Delete failed: ' + err.message, 'error');
    }
  };

  // ── Filter logic ──
  const filtered = exams.filter(ex => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      ex.subject_name.toLowerCase().includes(q) ||
      ex.subject_code.toLowerCase().includes(q);
    const matchSem  = !filterSem  || ex.semester  === filterSem;
    const matchYear = !filterYear || ex.year      === filterYear;
    const matchType = !filterType || ex.exam_type === filterType;
    return matchSearch && matchSem && matchYear && matchType;
  });

  // ── Stats ──
  const totalRegular      = exams.filter(e => e.exam_type === 'Regular').length;
  const totalSupp         = exams.filter(e => e.exam_type === 'Supplementary').length;
  const totalScheduled    = exams.filter(e => e.status === 'Scheduled').length;

  return (
    <div className="space-y-6">

      {/* ── Alerts ── */}
      {success && (
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-sans animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-sans">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-xl text-white flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-orange-burnt" />
            <span>Exam Schedule Manager</span>
          </h1>
          <p className="text-white/50 text-xs font-sans mt-1">
            Add, edit & manage B.Pharm University Exam Timetable — Regular & Supplementary
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchExams}
            className="p-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display font-bold text-xs rounded-xl shadow-lg hover:shadow-orange-burnt/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Exams',    value: exams.length,   color: 'text-white',        icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Scheduled',      value: totalScheduled, color: 'text-blue-400',     icon: <Calendar className="w-4 h-4" /> },
          { label: 'Regular',        value: totalRegular,   color: 'text-purple-400',   icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: 'Supplementary',  value: totalSupp,      color: 'text-orange-400',   icon: <AlertCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center space-x-3">
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <div className={`font-display font-extrabold text-2xl leading-none ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search subject / code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-sans placeholder:text-white/30 focus:outline-none focus:border-orange-burnt/50"
          />
        </div>
        {/* Semester filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <select
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-orange-burnt/50 appearance-none"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {/* Year filter */}
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-orange-burnt/50 appearance-none"
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {/* Type filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-orange-burnt/50 appearance-none"
        >
          <option value="">Regular + Supplementary</option>
          <option value="Regular">Regular Only</option>
          <option value="Supplementary">Supplementary Only</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-orange-burnt animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-display font-bold text-sm">No exams found</p>
            <p className="text-xs mt-1 font-sans">Add exams using the button above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {['Subject', 'Code', 'Semester', 'Year', 'Date', 'Time', 'Type', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-white/40 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(exam => (
                  <tr key={exam.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-4 py-3.5 text-white font-semibold max-w-[200px]">
                      <span className="line-clamp-2">{exam.subject_name}</span>
                      {exam.notes && (
                        <span className="block text-white/35 text-[10px] mt-0.5 truncate">{exam.notes}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-orange-burnt/80 whitespace-nowrap">{exam.subject_code}</td>
                    <td className="px-4 py-3.5 text-white/70 whitespace-nowrap">{exam.semester}</td>
                    <td className="px-4 py-3.5 text-white/70 whitespace-nowrap">{exam.year}</td>
                    <td className="px-4 py-3.5 text-white/70 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3 h-3 text-orange-burnt/60" />
                        <span>{new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-white/70 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3 text-orange-burnt/60" />
                        <span>{exam.exam_time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_STYLES[exam.exam_type]}`}>
                        {exam.exam_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[exam.status]}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(exam)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-white/50 hover:text-blue-400 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id, exam.subject_name)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-white/30 text-xs font-sans text-right">
          Showing {filtered.length} of {exams.length} exams
        </p>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0A1428] z-10">
              <h2 className="font-display font-extrabold text-base text-white flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-orange-burnt" />
                <span>{editId ? 'Edit Exam Entry' : 'Add New Exam'}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* Row 1: Subject Name + Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Subject Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharmaceutical Organic Chemistry II"
                    value={form.subject_name}
                    onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans placeholder:text-white/25 focus:outline-none focus:border-orange-burnt/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BP301T"
                    value={form.subject_code}
                    onChange={e => setForm(f => ({ ...f, subject_code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/25 focus:outline-none focus:border-orange-burnt/60"
                  />
                </div>
              </div>

              {/* Row 2: Semester + Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans focus:outline-none focus:border-orange-burnt/60 appearance-none"
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Year <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans focus:outline-none focus:border-orange-burnt/60 appearance-none"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Date + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Exam Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.exam_date}
                    onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans focus:outline-none focus:border-orange-burnt/60 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Exam Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={form.exam_time}
                    onChange={e => setForm(f => ({ ...f, exam_time: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans focus:outline-none focus:border-orange-burnt/60 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Row 4: Exam Type + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">Exam Type</label>
                  <div className="flex space-x-2">
                    {EXAM_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, exam_type: t }))}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          form.exam_type === t
                            ? t === 'Regular'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                              : 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                            : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {t === 'Regular' ? '📘 Regular' : '📙 Supplementary'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as ExamSchedule['status'] }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans focus:outline-none focus:border-orange-burnt/60 appearance-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">Notes / Additional Info</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Venue: Main Hall, Carry admit card, 3 hours duration..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-sans placeholder:text-white/25 focus:outline-none focus:border-orange-burnt/60 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs font-display font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display font-bold text-xs rounded-xl disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : editId ? 'Update Exam' : 'Add Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamSchedule;
