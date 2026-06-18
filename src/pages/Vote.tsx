import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Vote as VoteIcon, CheckCircle2, AlertTriangle, Mail, Clock } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { DNALoader } from '../components/DNALoader';

export const Vote: React.FC = () => {
  const [polls, setPolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setPolls(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#050B18] flex flex-col items-center justify-center">
        <ScienceBackground />
        <DNALoader />
        <span className="text-xs font-bold font-display uppercase tracking-widest text-white/50 mt-4 animate-pulse">Loading Live Polls...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={<VoteIcon className="w-6 h-6 animate-pulse" />}
        title="Live Voting Portal"
        subtitle="Cast your vote dynamically on campus initiatives, council changes, and student preferences. Voice of 500+ pharmacy students."
        breadcrumb="Vote"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 mt-12">
        {polls.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl flex flex-col items-center p-6 shadow-2xl">
            <VoteIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/70 mb-1">No Active Polls</h3>
            <p className="text-white/50 text-sm font-sans">There are no live surveys or student council polls running currently.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll, i) => (
              <motion.div key={poll.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <PollCard poll={poll} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PollCard: React.FC<{ poll: any }> = ({ poll }) => {
  const options: string[] = typeof poll.options === 'string' ? JSON.parse(poll.options) : (poll.options || []);
  const [selected, setSelected] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchResults = async () => {
    const { data } = await supabase
      .from('votes')
      .select('selected_option')
      .eq('poll_id', poll.id);
    const counts: Record<string, number> = {};
    options.forEach(o => { counts[o] = 0; });
    (data || []).forEach(v => { counts[v.selected_option] = (counts[v.selected_option] || 0) + 1; });
    setResults(counts);
    setTotalVotes((data || []).length);
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !voterEmail) return;
    setError('');
    setIsSubmitting(true);

    try {
      // Check duplicate
      const { data: existing } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('email', voterEmail.trim().toLowerCase())
        .maybeSingle();
      if (existing) {
        setError('You have already voted in this poll!');
        await fetchResults();
        setHasVoted(true);
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('votes').insert({
        poll_id: poll.id, email: voterEmail.trim().toLowerCase(), selected_option: selected,
      });
      if (insertError) throw insertError;

      await fetchResults();
      setHasVoted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to cast vote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = poll.end_date && new Date(poll.end_date) < new Date();

  return (
    <div className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-[0_8px_32px_rgba(5,11,24,0.4)] overflow-hidden transition-all duration-300">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-3.5 mb-3">
          <h3 className="font-display font-extrabold text-lg text-white flex items-center space-x-2">
            <VoteIcon className="w-5 h-5 text-orange-burnt animate-pulse" />
            <span>{poll.title}</span>
          </h3>
          {poll.end_date && (
            <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isExpired ? 'bg-red-500/10 text-red-400 border-red-500/25' : 'bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/25'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{isExpired ? 'Ended' : `Ends: ${new Date(poll.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}</span>
            </span>
          )}
        </div>
        {poll.description && <p className="text-white/60 text-sm font-sans mb-5 leading-relaxed">{poll.description}</p>}

        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.form key="form" onSubmit={handleVote} exit={{ opacity: 0 }} className="space-y-4">
              {error && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /><span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                {options.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selected === opt
                        ? 'border-orange-burnt bg-orange-burnt/10 text-orange-burnt shadow-lg'
                        : 'border-white/10 hover:border-orange-burnt/30 text-white/80 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`poll-${poll.id}`}
                      value={opt}
                      checked={selected === opt}
                      onChange={() => setSelected(opt)}
                      className="accent-orange-burnt w-4 h-4 bg-transparent border-white/20 text-orange-burnt"
                    />
                    <span className="text-sm font-display font-bold">{opt}</span>
                  </label>
                ))}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="email"
                  required
                  value={voterEmail}
                  onChange={e => setVoterEmail(e.target.value)}
                  placeholder="Enter your student email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#050B18] outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-orange-burnt transition-colors shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !selected || isExpired}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-orange-burnt/25 hover:-translate-y-[1px] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-white/5 active:scale-98"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <DNALoader />
                    <span>Casting Vote...</span>
                  </div>
                ) : (
                  <>
                    <VoteIcon className="w-4 h-4 text-white" />
                    <span>Cast Vote</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-display font-bold text-sm mb-2">
                <CheckCircle2 className="w-5 h-5 animate-pulse shrink-0" />
                <span>{error ? error : 'Vote Cast Successfully!'}</span>
              </div>
              <div className="space-y-3 pt-2">
                {options.map(opt => {
                  const count = results[opt] || 0;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className={`${selected === opt ? 'text-orange-burnt font-bold' : 'text-white/80'}`}>{opt}</span>
                        <span className="text-orange-burnt text-xs font-mono">{pct}% ({count} votes)</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${selected === opt ? 'from-orange-burnt to-[#E06D2B]' : 'from-white/10 to-white/20'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/40 text-xs font-mono text-right pt-2">Total votes cast: {totalVotes}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Vote;
