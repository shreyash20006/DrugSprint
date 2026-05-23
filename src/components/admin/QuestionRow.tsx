import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, MessageSquare, Trash2, Loader2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './Toast';
import { sendReplyToStudent } from '../../lib/brevo';

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
      // 1. Save reply to Supabase
      const { error } = await supabase
        .from('questions')
        .update({
          admin_reply: replyText,
          status: 'answered',
        })
        .eq('id', question.id);

      if (error) throw error;

      // 2. Send reply email to student (if email exists)
      if (question.student_email) {
        await sendReplyToStudent({
          studentName: question.student_name,
          studentEmail: question.student_email,
          directedTo: question.directed_to,
          questionText: question.question_text,
          adminReply: replyText,
        });
      }

      toast.success("✅ Reply submitted & email sent to student!");
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
      <tr className={`border-b border-navy-dark/5 hover:bg-navy-dark/[0.01] transition-colors ${isExpanded ? 'bg-navy-dark/[0.015]' : ''}`}>
        
        {/* Toggle Collapse */}
        <td className="px-4 py-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-navy-dark/40 hover:bg-navy-dark/5 hover:text-navy-dark transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>

        {/* Student Name */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="font-display font-bold text-sm text-navy-dark">
            {question.student_name}
          </span>
          {question.student_email && (
            <span className="block text-[10px] text-navy-dark/45 font-sans mt-0.5">
              {question.student_email}
            </span>
          )}
        </td>

        {/* Student Year */}
        <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-navy-dark/75">
          {question.student_year}
        </td>

        {/* Directed To */}
        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-orange-burnt">
          {question.directed_to}
        </td>

        {/* Snippet of Question */}
        <td className="px-6 py-4 text-sm text-navy-dark/80 max-w-xs truncate">
          {question.question_text}
        </td>

        {/* Status Badge */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getStatusBadge(question.status)}`}>
            {question.status}
          </span>
        </td>

        {/* Date Row */}
        <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/50 flex items-center space-x-1.5 mt-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </td>

        {/* Actions Button Panel */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
          {question.status === 'pending' && (
            <button
              onClick={handleMarkSeen}
              disabled={isUpdatingStatus}
              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white transition-colors"
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
            className="inline-flex items-center p-1.5 rounded-lg text-navy-dark/40 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          <td colSpan={8} className="px-8 py-5 bg-navy-dark/[0.015] border-b border-navy-dark/5">
            <div className="space-y-4 max-w-3xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/40 block mb-1">
                  Full Question Text
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-navy-dark/85 bg-white p-4 rounded-lg border border-navy-dark/5 shadow-inner">
                  "{question.question_text}"
                </p>
              </div>

              <form onSubmit={handleReplySubmit} className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/40 block">
                  Admin Reply / Response
                </span>
                <textarea
                  required
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official response or explanation here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none transition-colors resize-none bg-white"
                />
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display text-xs font-semibold shadow-md transition-colors"
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
                    className="py-2 px-4 rounded-lg border border-navy-dark/15 hover:bg-navy-dark/5 text-navy-dark font-display text-xs font-semibold transition-colors"
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
