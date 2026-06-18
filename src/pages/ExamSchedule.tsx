import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  CalendarDays,
  Clock,
  BookOpen,
  Search,
  Filter,
  GraduationCap,
  AlertCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

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
  Regular:        'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Supplementary:  'bg-orange-500/15 text-orange-300 border-orange-500/30',
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
      setError('Failed to fetch exam schedules. Please try again.');
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
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
          Cancelled
        </span>
      );
    }
    if (status === 'Postponed') {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider animate-pulse">
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
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 uppercase tracking-wider animate-pulse flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          <span>Today</span>
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
          Tomorrow
        </span>
      );
    }
    if (diffDays > 1) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wider">
          In {diffDays} Days
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/5 text-white/40 border border-white/5 uppercase tracking-wider">
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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader
        icon={<Calendar className="w-6 h-6 animate-pulse text-orange-burnt" />}
        title="Exam Timetable"
        subtitle="Access official B.Pharm University semester examinations schedules, subjects, dates, and timing."
        breadcrumb="Exam Schedule"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Filters Panel */}
        <div className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-2xl p-6 mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input
                type="text"
                placeholder="Search subject / code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#050B18] outline-none text-xs sm:text-sm text-white placeholder-white/30 focus:border-orange-burnt transition-colors"
              />
            </div>

            {/* Semester Filter */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#050B18] outline-none text-xs sm:text-sm text-white focus:border-orange-burnt transition-colors cursor-pointer appearance-none"
              >
                <option value="All" className="bg-[#0D1B3E]">All Semesters</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s} className="bg-[#0D1B3E]">
                    {s}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▼</div>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#050B18] outline-none text-xs sm:text-sm text-white focus:border-orange-burnt transition-colors cursor-pointer appearance-none"
              >
                <option value="All" className="bg-[#0D1B3E]">All Years</option>
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-[#0D1B3E]">
                    {y}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▼</div>
            </div>

            {/* Exam Type Filter */}
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#050B18] outline-none text-xs sm:text-sm text-white focus:border-orange-burnt transition-colors cursor-pointer appearance-none"
              >
                <option value="All" className="bg-[#0D1B3E]">All Types</option>
                <option value="Regular" className="bg-[#0D1B3E]">Regular Only</option>
                <option value="Supplementary" className="bg-[#0D1B3E]">Supplementary Only</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▼</div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-panel border border-red-500/25 bg-red-500/5 p-6 rounded-2xl flex items-center space-x-3 text-red-400 max-w-lg mx-auto mb-12 shadow-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-sans">{error}</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="glass-panel rounded-2xl p-6 border border-white/5 h-52 overflow-hidden relative"
              >
                <div className="absolute inset-0 shimmer pointer-events-none" />
                <div className="h-4 bg-white/5 w-1/3 rounded mb-3" />
                <div className="h-6 bg-white/5 w-3/4 rounded mb-2" />
                <div className="h-3.5 bg-white/5 w-1/2 rounded mb-6" />
                <div className="h-10 bg-white/5 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl max-w-lg mx-auto flex flex-col items-center p-6 shadow-2xl">
            <CalendarDays className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/70 mb-1">No Exams Found</h3>
            <p className="text-white/50 text-sm font-sans">No exam entries match the selected filters currently.</p>
            <button
              onClick={fetchExams}
              className="mt-6 flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold shadow-md hover:shadow-orange-burnt/10 active:scale-98 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Schedule</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="group relative bg-[#0D1B3E]/85 border border-orange-burnt/25 hover:border-orange-burnt/50 backdrop-blur-[16px] rounded-2xl shadow-xl p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Ribbon Accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-burnt to-gold-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${TYPE_STYLES[exam.exam_type]}`}>
                      {exam.exam_type}
                    </span>
                    {getCountdownBadge(exam.exam_date, exam.status)}
                  </div>

                  <h3 className="font-display font-extrabold text-base text-white group-hover:text-orange-burnt transition-colors leading-snug line-clamp-2">
                    {exam.subject_name}
                  </h3>
                  <p className="font-mono text-orange-burnt/80 text-xs font-bold mt-1.5 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{exam.subject_code}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center text-white/70 text-xs">
                      <Calendar className="w-4 h-4 mr-2 text-orange-burnt/60" />
                      <span className="font-sans font-semibold">{formatDate(exam.exam_date)}</span>
                    </div>
                    <div className="flex items-center text-white/70 text-xs">
                      <Clock className="w-4 h-4 mr-2 text-orange-burnt/60" />
                      <span className="font-sans font-semibold">{exam.exam_time}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <span>{exam.semester}</span>
                    <span>•</span>
                    <span>{exam.year}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold border ${STATUS_STYLES[exam.status]}`}>
                    {exam.status}
                  </span>
                </div>

                {exam.notes && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-white/55 font-sans leading-relaxed">
                    <strong className="text-orange-burnt/75">Instructions:</strong> {exam.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamSchedule;
