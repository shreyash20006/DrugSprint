import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/admin/DataTable';
import { QuestionRow } from '../../components/admin/QuestionRow';
import { councilMembers } from '../../data/council';
import { useToast } from '../../components/admin/Toast';
import { sendQuestionReplyEmail } from '../../lib/brevo';
import { 
  Mail, 
  AlertCircle, 
  Inbox, 
  CheckCircle,
  Calendar,
  Check,
  MessageSquare,
  Trash2,
  Loader2
} from 'lucide-react';

/* ========================================================
 * MOBILE COLLAPSIBLE CARD COMPONENT FOR QUESTIONS
 * ======================================================== */
const QuestionCardMobile: React.FC<{ question: any; onRefresh: () => void }> = ({
  question,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState(question.admin_reply || '');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setReplyText(question.admin_reply || '');
  }, [question.admin_reply]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'seen':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'pending':
      default:
        return 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20';
    }
  };

  const handleMarkSeen = async () => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: 'seen' })
        .eq('id', question.id);

      if (error) throw error;
      toast.success("✅ Question marked as seen!");
      onRefresh();
    } catch (err: any) {
      toast.error(`❌ Action failed! ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsReplying(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          admin_reply: replyText,
          status: 'answered',
        })
        .eq('id', question.id);

      if (error) throw error;

      // Send email notification to student if email is available
      if (question.student_email) {
        try {
          await sendQuestionReplyEmail({
            studentName: question.student_name,
            studentEmail: question.student_email,
            questionText: question.question_text,
            replyText: replyText,
            directedTo: question.directed_to,
          });
        } catch (emailErr) {
          console.warn("Failed to send reply email to student:", emailErr);
        }
      }

      toast.success("✅ Reply submitted successfully!");
      onRefresh();
      setIsExpanded(false);
    } catch (err: any) {
      toast.error(`❌ Failed to submit reply. ${err.message}`);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this question? Cannot undo.')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', question.id);

      if (error) throw error;
      toast.success("✅ Question deleted permanently!");
      onRefresh();
    } catch (err: any) {
      toast.error(`❌ Failed to delete question. ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(question.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-5 space-y-4 hover:bg-navy-dark/[0.01] transition-colors relative">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-display font-extrabold text-sm text-navy-dark">
            {question.student_name}
          </h4>
          <span className="text-[10px] text-navy-dark/50 font-sans block">
            {question.student_year}
          </span>
        </div>
        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getStatusBadge(question.status)}`}>
          {question.status}
        </span>
      </div>

      {/* Target Member Tag */}
      <div className="text-[11px] font-semibold text-orange-burnt">
        To: {question.directed_to}
      </div>

      {/* Snippet of Question */}
      <p className="text-xs text-navy-dark/80 font-sans bg-gray-50/50 p-3 rounded-lg border border-navy-dark/5 italic leading-relaxed">
        "{question.question_text}"
      </p>

      {/* Date published */}
      <div className="flex items-center space-x-1.5 text-[10px] text-navy-dark/40 font-medium">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formattedDate}</span>
      </div>

      {/* Action panel triggers */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-navy-dark/5">
        {question.status === 'pending' && (
          <button
            onClick={handleMarkSeen}
            disabled={isUpdatingStatus}
            className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white text-xs font-semibold transition-colors"
          >
            {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Mark Seen</span>
          </button>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg bg-orange-burnt/10 text-orange-burnt hover:bg-orange-burnt hover:text-white text-xs font-semibold transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{question.status === 'answered' ? 'Edit Reply' : 'Reply'}</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg text-navy-dark/45 hover:bg-red-50 hover:text-red-600 transition-colors border border-navy-dark/5"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Inline Collapsible Reply Drawer Box */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-navy-dark/5 space-y-3 bg-gray-50/50 p-4 rounded-xl">
          {question.student_email && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-navy-dark/40 block mb-0.5">
                Student Email Address
              </span>
              <p className="text-xs text-navy-dark/80 bg-white px-3 py-1.5 rounded-lg border border-navy-dark/5 font-sans select-all">
                {question.student_email}
              </p>
            </div>
          )}
          <span className="text-[9px] font-bold uppercase tracking-widest text-navy-dark/40 block">
            Admin Response / Reply
          </span>
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <textarea
              required
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Provide a formal response or student advice here..."
              className="w-full p-2.5 text-xs rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none bg-white font-sans resize-none"
            />
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isReplying || !replyText.trim()}
                className="flex-1 py-2 rounded-lg bg-orange-burnt text-white font-display text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1"
              >
                {isReplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Reply</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="py-2 px-3 rounded-lg border border-navy-dark/15 hover:bg-navy-dark/5 text-navy-dark font-display text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const AdminQuestions: React.FC = () => {
  const { refreshBadge } = useOutletContext<{ refreshBadge: () => void }>();
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
      if (refreshBadge) refreshBadge();
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Apply filters on query or dropdown selections
  useEffect(() => {
    let result = [...questions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.student_name.toLowerCase().includes(query) ||
          q.question_text.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((q) => q.status === statusFilter.toLowerCase());
    }

    if (memberFilter !== 'All') {
      result = result.filter((q) => q.directed_to === memberFilter);
    }

    setFilteredQuestions(result);
  }, [questions, searchQuery, statusFilter, memberFilter]);

  // Derived metrics
  const pending = questions.filter((q) => q.status === 'pending').length;
  const seen = questions.filter((q) => q.status === 'seen').length;
  const answered = questions.filter((q) => q.status === 'answered').length;

  const headers = [
    { key: 'detail', label: 'Detail', className: 'w-12 text-center' },
    { key: 'student_name', label: 'Student' },
    { key: 'student_year', label: 'Year' },
    { key: 'directed_to', label: 'Directed To' },
    { key: 'question_text', label: 'Question Summary' },
    { key: 'status', label: 'Status', className: 'w-28' },
    { key: 'created_at', label: 'Date', className: 'w-32' },
    { key: 'actions', label: 'Actions', className: 'text-right w-64' }
  ];

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending 🟠' },
    { value: 'Seen', label: 'Seen 🔵' },
    { value: 'Answered', label: 'Answered 🟢' }
  ];

  const recipientOptions = [
    { value: 'All', label: 'All Recipients' },
    { value: 'General Council', label: 'General Council' },
    ...councilMembers.map((m) => ({ value: m.name, label: `${m.name} (${m.role})` }))
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-orange-burnt/10 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-burnt/75">Pending Inquiries</span>
            <span className="block font-display font-extrabold text-xl text-orange-burnt">{pending}</span>
          </div>
          <AlertCircle className="w-5 h-5 text-orange-burnt/60 animate-pulse" />
        </div>

        <div className="bg-white border border-blue-500/10 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/75">Seen Questions</span>
            <span className="block font-display font-extrabold text-xl text-blue-600">{seen}</span>
          </div>
          <Inbox className="w-5 h-5 text-blue-500/50" />
        </div>

        <div className="bg-white border border-emerald-500/10 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/75">Answered Inquiries</span>
            <span className="block font-display font-extrabold text-xl text-emerald-600">{answered}</span>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500/60" />
        </div>
      </div>

      {/* Consolidated DataTable Rendering */}
      <DataTable
        headers={headers}
        data={filteredQuestions}
        isLoading={isLoading}
        emptyState={{
          icon: <Mail className="w-12 h-12 text-navy-dark/15" />,
          title: 'No Questions Found',
          description: 'Try adjusting your search query, selecting another category status filter, or checking other executive members.'
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search questions by student name or inquiry details..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        secondaryFilterValue={memberFilter}
        onSecondaryFilterChange={setMemberFilter}
        secondaryFilterOptions={recipientOptions}
        renderRowDesktop={(item) => (
          <QuestionRow 
            key={item.id} 
            question={item} 
            onRefresh={fetchQuestions} 
          />
        )}
        renderCardMobile={(item) => (
          <QuestionCardMobile 
            key={item.id} 
            question={item} 
            onRefresh={fetchQuestions} 
          />
        )}
      />

    </div>
  );
};

export default AdminQuestions;
