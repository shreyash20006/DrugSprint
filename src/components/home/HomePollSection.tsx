import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardBadge } from '../ui/Card';
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

  return (
    <Section>
      <Card variant="default" padding="xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 ambient-orb-orange rounded-full pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-6 space-y-5">
            <CardBadge tone="orange">
              <Sparkles className="w-3 h-3" strokeWidth={2.4} />
              <span>Live Student Voting</span>
            </CardBadge>

            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white leading-tight">
              {poll.title}
            </h2>
            {poll.description && (
              <p className="text-white/65 text-sm sm:text-base font-sans leading-relaxed">{poll.description}</p>
            )}
            <div className="flex items-center gap-3 text-white/45 text-xs font-sans">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.4} />
                {totalVotes} total votes
              </span>
              {poll.end_date && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />
                    Ends {new Date(poll.end_date).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            {hasVoted ? (
              <div className="bg-[#050B18]/60 border border-orange-burnt/20 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2.4} />
                  <span>Thank you! Your voice has been recorded.</span>
                </div>
                <div className="space-y-4">
                  {poll.options.map((opt) => {
                    const pct = getPercent(opt);
                    return (
                      <div key={opt} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-white">
                          <span>{opt}</span>
                          <span className="text-orange-burnt font-bold">
                            {pct}% · {getVotes(opt)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-orange-burnt to-gold-accent rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  {poll.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedOption === opt
                          ? 'border-orange-burnt bg-orange-burnt/10 text-orange-burnt shadow-lg shadow-orange-burnt/10'
                          : 'border-white/10 hover:border-orange-burnt/30 text-white/85 bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poll-option"
                        value={opt}
                        checked={selectedOption === opt}
                        onChange={() => setSelectedOption(opt)}
                        className="text-orange-burnt focus:ring-orange-burnt border-white/20 bg-transparent"
                      />
                      <span className="font-display font-bold text-xs sm:text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="email"
                    placeholder="Enter your student email"
                    required
                    value={votingEmail}
                    onChange={(e) => setVotingEmail(e.target.value)}
                    className="flex-grow px-4 py-3 rounded-xl border border-orange-burnt/25 text-xs sm:text-sm bg-[#050B18]/60 focus:outline-none focus:border-orange-burnt text-white font-sans"
                  />
                  <button
                    type="submit"
                    data-testid="cast-vote-btn"
                    disabled={isSubmitting || !selectedOption}
                    className="px-6 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:scale-[1.02] active:scale-[0.98] text-white font-display text-xs font-bold uppercase tracking-[0.18em] rounded-xl shadow-lg disabled:opacity-50 transition-all shrink-0 border border-white/5"
                  >
                    {isSubmitting ? 'Voting...' : 'Cast Vote'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Card>
    </Section>
  );
};

export default HomePollSection;
