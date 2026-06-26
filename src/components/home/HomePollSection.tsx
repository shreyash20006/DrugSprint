import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, TrendingUp, Calendar, Lock, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Section } from './Section';
import type { HomePoll } from '../../hooks/useHomePageData';

interface HomePollProps {
  poll: HomePoll;
  votes: { selected_option: string }[];
  onVoted: () => void;
}

export const HomePollSection: React.FC<HomePollProps> = ({ poll, votes, onVoted }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [votingEmail, setVotingEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    const votedPolls = JSON.parse(localStorage.getItem('tgpcop_voted_polls') || '[]');
    return votedPolls.includes(poll.id);
  });

  const totalVotes = votes.length;
  const getPercent = (opt: string) =>
    totalVotes === 0 ? 0 : Math.round((votes.filter((v) => v.selected_option === opt).length / totalVotes) * 100);
  const getVotes = (opt: string) => votes.filter((v) => v.selected_option === opt).length;
  const getWinner = () => poll.options.reduce((a, b) => (getVotes(a) >= getVotes(b) ? a : b), poll.options[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !votingEmail) return;
    setIsSubmitting(true);
    try {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('email', votingEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingVote) {
        alert('You have already voted in this poll with this email!');
        const votedPolls = JSON.parse(localStorage.getItem('tgpcop_voted_polls') || '[]');
        if (!votedPolls.includes(poll.id)) {
          votedPolls.push(poll.id);
          localStorage.setItem('tgpcop_voted_polls', JSON.stringify(votedPolls));
        }
        setHasVoted(true);
        return;
      }

      const { error } = await supabase.from('votes').insert({
        poll_id: poll.id,
        email: votingEmail.trim().toLowerCase(),
        selected_option: selectedOption,
      });
      if (error) throw error;

      const votedPolls = JSON.parse(localStorage.getItem('tgpcop_voted_polls') || '[]');
      votedPolls.push(poll.id);
      localStorage.setItem('tgpcop_voted_polls', JSON.stringify(votedPolls));
      setHasVoted(true);
      onVoted();
    } catch (err: any) {
      alert('Failed to cast vote: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const winner = hasVoted ? getWinner() : null;

  return (
    <Section>
      <div
        className="relative overflow-hidden rounded-3xl p-px"
        style={{ background: 'linear-gradient(135deg, var(--pw-purple) 0%, var(--pw-yellow) 100%)' }}
      >
        <div
          className="relative rounded-[22px] p-8 sm:p-10 overflow-hidden"
          style={{ background: 'var(--bg-card)' }}
        >
          {/* Ambient orb */}
          <div className="absolute -top-16 -right-16 w-72 h-72 ambient-orb-orange rounded-full pointer-events-none opacity-50" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 ambient-orb-gold rounded-full pointer-events-none opacity-30" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left: Poll info */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="pw-badge">
                  <Sparkles className="w-3 h-3" strokeWidth={2.4} />
                  <span>Live Student Poll</span>
                </span>
                <span className="live-indicator">Active</span>
              </div>

              <h2
                className="font-display font-extrabold text-2xl sm:text-3xl leading-tight tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {poll.title}
              </h2>

              {poll.description && (
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {poll.description}
                </p>
              )}

              {/* Stats row */}
              <div
                className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--pw-purple)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--pw-purple)' }}>{totalVotes}</strong> votes cast
                  </span>
                </span>
                {poll.end_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Closes {new Date(poll.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              {/* Option count indicators */}
              <div className="flex flex-wrap gap-2 pt-1">
                {poll.options.map((opt) => (
                  <span
                    key={opt}
                    className="text-[10px] px-2.5 py-1 rounded-full font-semibold border"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Vote form or Results */}
            <div className="lg:col-span-6">
              <AnimatePresence mode="wait">
                {hasVoted ? (
                  /* ─── Results view ─── */
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="rounded-2xl p-6 space-y-5 border"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  >
                    {/* Thank you banner */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth={2.2} />
                      <div>
                        <p className="text-sm font-bold text-emerald-400">Vote Recorded!</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Thank you for making your voice heard.</p>
                      </div>
                    </div>

                    {/* Animated result bars */}
                    <div className="space-y-4">
                      {poll.options.map((opt) => {
                        const pct = getPercent(opt);
                        const isWinner = opt === winner;
                        return (
                          <div key={opt} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${isWinner ? 'text-amber-400' : ''}`}
                                style={!isWinner ? { color: 'var(--text-primary)' } : {}}
                              >
                                {isWinner && <TrendingUp className="w-3.5 h-3.5" />}
                                {opt}
                              </span>
                              <span className="text-xs font-bold" style={{ color: isWinner ? 'var(--pw-yellow)' : 'var(--text-muted)' }}>
                                {pct}% · {getVotes(opt)}
                              </span>
                            </div>
                            <div className="progress-bar-track">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                                className={isWinner ? 'progress-bar-fill-yellow' : 'progress-bar-fill'}
                                style={{ height: '100%', borderRadius: '100px' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* ─── Voting form ─── */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Radio options */}
                    <div className="space-y-2.5">
                      {poll.options.map((opt) => {
                        const isSelected = selectedOption === opt;
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer"
                            style={{
                              borderColor: isSelected ? 'var(--pw-purple)' : 'var(--border-subtle)',
                              background: isSelected ? 'rgba(124,58,237,0.08)' : 'var(--bg-surface)',
                              boxShadow: isSelected ? '0 0 0 3px rgba(124,58,237,0.10)' : undefined,
                            }}
                          >
                            {/* Custom radio */}
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                              style={{
                                borderColor: isSelected ? 'var(--pw-purple)' : 'var(--border-mid)',
                              }}
                            >
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: 'var(--pw-purple)' }}
                                />
                              )}
                            </div>
                            <input
                              type="radio"
                              name="poll-option"
                              value={opt}
                              checked={isSelected}
                              onChange={() => setSelectedOption(opt)}
                              className="sr-only"
                            />
                            <span
                              className="font-display font-semibold text-xs sm:text-sm"
                              style={{ color: isSelected ? 'var(--pw-purple)' : 'var(--text-primary)' }}
                            >
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Email + submit row */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <div className="search-box flex-1">
                        <Lock className="search-box-icon w-3.5 h-3.5" />
                        <input
                          type="email"
                          placeholder="Your student email"
                          required
                          value={votingEmail}
                          onChange={(e) => setVotingEmail(e.target.value)}
                          className="search-box-input"
                          style={{ paddingLeft: '36px', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <button
                        type="submit"
                        data-testid="cast-vote-btn"
                        disabled={isSubmitting || !selectedOption}
                        className="btn-pw-primary px-6 py-3 text-xs tracking-widest uppercase shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Voting…' : 'Cast Vote'}
                      </button>
                    </div>

                    <p className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Lock className="w-3 h-3" />
                      One vote per email address. Results are anonymous.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default HomePollSection;
