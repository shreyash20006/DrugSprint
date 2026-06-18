import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  CalendarDays,
  Clock,
  BookOpen,
  Search,
  AlertCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ExamScheduleItem {
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

const SEMESTERS = ['Sem I', 'Sem II', 'Sem III', 'Sem IV', 'Sem V', 'Sem VI', 'Sem VII', 'Sem VIII'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year (Final)'];

const STATUS_STYLES: Record<ExamScheduleItem['status'], string> = {
  Scheduled:    'bg-blue-500/10 text-blue-400 border-blue-500/25',
  Postponed:    'bg-amber-500/10 text-amber-400 border-amber-500/25',
  Completed:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  Cancelled:    'bg-red-500/10 text-red-400 border-red-500/25',
};

const TYPE_STYLES: Record<ExamScheduleItem['exam_type'], string> = {
  Regular:        'bg-purple-500/10 text-purple-300 border-purple-500/25',
  Supplementary:  'bg-orange-500/10 text-orange-300 border-orange-500/25',
};

export const ExamSchedule: React.FC = () => {
  const [exams, setExams] = useState<ExamScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSem, setSelectedSem] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const fetchExams = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select('*')
        .order('exam_date', { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (err: any) {
      console.error('Error fetching exams:', err);
      setError('Failed to fetch exam schedules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const filteredExams = React.useMemo(() => {
    return exams.filter((ex) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        ex.subject_name.toLowerCase().includes(q) ||
        ex.subject_code.toLowerCase().includes(q);
      const matchSem = selectedSem === 'All' || ex.semester === selectedSem;
      const matchYear = selectedYear === 'All' || ex.year === selectedYear;
      const matchType = selectedType === 'All' || ex.exam_type === selectedType;

      return matchSearch && matchSem && matchYear && matchType;
    });
  }, [exams, searchQuery, selectedSem, selectedYear, selectedType]);

  const getCountdownBadge = (dateStr: string, status: ExamScheduleItem['status']) => {
    if (status === 'Cancelled') {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
          Cancelled
        </span>
      );
    }
    if (status === 'Postponed') {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider animate-pulse">
          Postponed
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr + 'T00:00:00');
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 uppercase tracking-wider animate-pulse flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          <span>Today</span>
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
          Tomorrow
        </span>
      );
    }
    if (diffDays > 1) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wider">
          In {diffDays} Days
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-white/5 text-white/40 border border-white/5 uppercase tracking-wider">
        Completed
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Exams Desk
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Exam Timetable
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Access official DBATU/MSBTE B.Pharm schedules, subjects, dates, and instructions.
        </p>
      </section>

      {/* Filters Board Drawer Panel */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl space-y-3 shadow-lg">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="text"
            placeholder="Search subject / code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#050B18]/60 outline-none text-xs text-white placeholder-white/30 focus:border-orange-burnt"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Sem */}
          <div className="relative">
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-2 py-2.5 text-[10px] text-white outline-none focus:border-orange-burnt appearance-none cursor-pointer text-center"
            >
              <option value="All">All Sems</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-2 py-2.5 text-[10px] text-white outline-none focus:border-orange-burnt appearance-none cursor-pointer text-center"
            >
              <option value="All">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-2 py-2.5 text-[10px] text-white outline-none focus:border-orange-burnt appearance-none cursor-pointer text-center"
            >
              <option value="All">All Types</option>
              <option value="Regular">Regular</option>
              <option value="Supplementary">Suppl.</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center space-x-2.5 text-red-400">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <p className="text-xs font-sans">{error}</p>
        </div>
      )}

      {/* Grid items */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Loading Timetable...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <CalendarDays className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No Schedules</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            No active exams are matching these filters currently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam, idx) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4.5 space-y-3.5 shadow-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider ${TYPE_STYLES[exam.exam_type]}`}>
                  {exam.exam_type}
                </span>
                {getCountdownBadge(exam.exam_date, exam.status)}
              </div>

              <div>
                <h3 className="font-display font-extrabold text-sm text-white leading-snug">
                  {exam.subject_name}
                </h3>
                <p className="font-mono text-orange-burnt text-[10px] font-bold mt-1 flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{exam.subject_code}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center text-white/70 text-[11px] font-sans">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-orange-burnt" />
                  <span className="font-semibold">{formatDate(exam.exam_date)}</span>
                </div>
                <div className="flex items-center text-white/70 text-[11px] font-sans">
                  <Clock className="w-3.5 h-3.5 mr-2 text-orange-burnt" />
                  <span className="font-semibold">{exam.exam_time}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                <span>{exam.semester} • {exam.year}</span>
                <span className={`px-2 py-0.5 rounded border ${STATUS_STYLES[exam.status]}`}>
                  {exam.status}
                </span>
              </div>

              {exam.notes && (
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[9px] text-white/50 leading-relaxed">
                  <strong className="text-orange-burnt">Instructions:</strong> {exam.notes}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamSchedule;
