import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, MessageSquare, Trash2, Loader2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './Toast';
import { sendQuestionReplyEmail } from '../../lib/brevo';
import { logAction } from '../../lib/logger';

interface QuestionRowProps {
  question: any;
  onRefresh: () => void;
}

export const QuestionRow: React.FC<QuestionRowProps> = ({ question, onRefresh }) => {
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

      logAction('REPLIED_QUESTION', `Reply sent to ${question.student_name} (${question.directed_to})`);
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
    if (!window.confirm('Are you sure you want to delete this question? This action is permanent.')) {
      return;
    }

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
    <>
      {/* 1. PRIMARY TABLE ROW */}
      <tr className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}>
        
        {/* Toggle Collapse */}
        <td className="px-4 py-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-white/40 hover:bg-white/5 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>

        {/* Student Name */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="font-display font-bold text-sm text-white">
            {question.student_name}
          </span>
        </td>

        {/* Student Year */}
        <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white/60">
          {question.student_year}
        </td>

        {/* Directed To */}
        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-orange-burnt">
          {question.directed_to}
        </td>

        {/* Snippet of Question */}
        <td className="px-6 py-4 text-sm text-white/80 max-w-xs truncate">
          {question.question_text}
        </td>

        {/* Status Badge */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getStatusBadge(question.status)}`}>
            {question.status}
          </span>
        </td>

        {/* Date Row */}
        <td className="px-6 py-4 whitespace-nowrap text-xs text-white/40 flex items-center space-x-1.5 mt-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </td>

        {/* Actions Button Panel */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
          {question.status === 'pending' && (
            <button
              onClick={handleMarkSeen}
              disabled={isUpdatingStatus}
              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/5"
              title="Mark as Seen"
            >
              {isUpdatingStatus ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Seen</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-orange-burnt/10 text-orange-burnt hover:bg-orange-burnt hover:text-white transition-colors"
            title="Inline Reply"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{question.status === 'answered' ? 'Edit Reply' : 'Reply'}</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center p-1.5 rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-white/5"
            title="Delete Permanently"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </td>
      </tr>

      {/* 2. EXPANDING REPLY PANEL DRAWER */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-8 py-5 bg-white/[0.01] border-b border-white/5">
            <div className="space-y-4 max-w-3xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                  Full Question Text
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-white bg-[#0D1B3E]/60 p-4 rounded-lg border border-white/10 shadow-inner">
                  "{question.question_text}"
                </p>
              </div>

              {question.student_email && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                    Student Email Address
                  </span>
                  <p className="text-sm leading-relaxed text-white bg-[#0D1B3E]/60 px-4 py-2.5 rounded-lg border border-white/10 shadow-inner font-sans select-all">
                    {question.student_email}
                  </p>
                </div>
              )}

              <form onSubmit={handleReplySubmit} className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
                  Admin Reply / Response
                </span>
                <textarea
                  required
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official response or explanation here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none transition-all resize-none bg-white/5 text-white placeholder:text-white/20"
                />
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-[0_4px_12px_rgba(214,90,30,0.3)] text-white font-display text-xs font-semibold shadow-md transition-colors"
                  >
                    {isReplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Submit Reply</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="py-2 px-4 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 font-display text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default QuestionRow;
