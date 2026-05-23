import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { QuestionRow } from '../../components/admin/QuestionRow';
import { councilMembers } from '../../data/council';
import { 
  Mail, 
  Search, 
  Filter, 
  Loader2, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle,
  Inbox
} from 'lucide-react';

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err: any) {
      console.error('Error fetching questions:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Apply filters on search, status filter, or member filter changes
  useEffect(() => {
    let result = [...questions];

    // 1. Search Query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.student_name.toLowerCase().includes(query) ||
          q.question_text.toLowerCase().includes(query)
      );
    }

    // 2. Status filter
    if (statusFilter !== 'All') {
      result = result.filter((q) => q.status === statusFilter.toLowerCase());
    }

    // 3. Member / Recipient filter
    if (memberFilter !== 'All') {
      result = result.filter((q) => q.directed_to === memberFilter);
    }

    setFilteredQuestions(result);
  }, [questions, searchQuery, statusFilter, memberFilter]);

  // Derived Stats
  const total = questions.length;
  const pending = questions.filter((q) => q.status === 'pending').length;
  const seen = questions.filter((q) => q.status === 'seen').length;
  const answered = questions.filter((q) => q.status === 'answered').length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-light w-full">
      {/* Sidebar Navigation */}
      <AdminSidebar activeTab="questions" pendingQuestionsCount={pending} />

      {/* Main View Container */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        
        {/* Page Header */}
        <header className="bg-white border-b border-navy-dark/5 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-dark uppercase flex items-center space-x-2">
              <Mail className="w-6 h-6 text-orange-burnt" />
              <span>Questions Hub</span>
            </h1>
            <p className="text-xs text-navy-dark/60 mt-0.5">
              Read, tag seen, reply inline, and manage student concerns directly.
            </p>
          </div>

          <button
            onClick={fetchQuestions}
            className="self-start sm:self-auto px-4 py-2 border border-navy-dark/15 hover:bg-navy-dark hover:text-white rounded-lg font-display text-xs font-semibold transition-colors"
          >
            Refresh List
          </button>
        </header>

        {/* Dashboard Panels */}
        <div className="flex-grow overflow-y-auto p-8 space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-navy-dark/5 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/45">Total Questions</span>
                <span className="block font-display font-extrabold text-xl text-navy-dark">{total}</span>
              </div>
              <HelpCircle className="w-5 h-5 text-navy-dark/30" />
            </div>

            <div className="bg-white border border-orange-burnt/10 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-burnt/70">Pending Review</span>
                <span className="block font-display font-extrabold text-xl text-orange-burnt">{pending}</span>
              </div>
              <AlertCircle className="w-5 h-5 text-orange-burnt/60 animate-pulse" />
            </div>

            <div className="bg-white border border-blue-500/10 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/70">Seen Inquiries</span>
                <span className="block font-display font-extrabold text-xl text-blue-600">{seen}</span>
              </div>
              <Inbox className="w-5 h-5 text-blue-500/50" />
            </div>

            <div className="bg-white border border-emerald-500/10 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Answered Questions</span>
                <span className="block font-display font-extrabold text-xl text-emerald-600">{answered}</span>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500/60" />
            </div>
          </div>

          {/* Filtering and Searching Overlay */}
          <div className="bg-white border border-navy-dark/5 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full md:flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-dark/30">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or question description..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-gray-50/50 transition-colors"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-navy-dark/40 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-40 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-xs font-semibold uppercase tracking-wider text-navy-dark/80 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Seen">Seen</option>
                  <option value="Answered">Answered</option>
                </select>
              </div>

              {/* Council Member Filter */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-xs font-semibold uppercase tracking-wider text-navy-dark/80 bg-white"
                >
                  <option value="All">All Recipients</option>
                  <option value="General Council">General Council</option>
                  {councilMembers.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white border border-navy-dark/5 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="h-72 flex flex-col items-center justify-center text-navy-dark/40">
                <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
                <p className="font-display text-sm tracking-wider uppercase">Loading database content...</p>
              </div>
            ) : filteredQuestions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-navy-dark text-white border-b border-navy-dark/10">
                      <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-white/50 w-12">Detail</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Student</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Year</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Directed To</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Question Summary</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-28">Status</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-32">Date</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-white/50 w-64">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-dark/5 bg-white">
                    {filteredQuestions.map((q) => (
                      <QuestionRow key={q.id} question={q} onRefresh={fetchQuestions} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 bg-white">
                <Mail className="w-12 h-12 text-navy-dark/15 mx-auto mb-4" />
                <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wider">No Questions Found</h3>
                <p className="text-xs text-navy-dark/50 max-w-sm mx-auto mt-1 leading-relaxed">
                  Try adjusting your keywords, changing your status filters, or selecting a different council member recipient.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminQuestions;
