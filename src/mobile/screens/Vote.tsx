import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Vote as VoteIcon, CheckCircle2, AlertTriangle, Mail, Clock, Loader2 } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-orange-burnt animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 font-display">Loading Live Polls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <VoteIcon className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Live Voting Portal
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Campus Decisions
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Cast your vote dynamically on campus initiatives, council operations, and sports week timetables. Voice of TGPCOP students.
        </p>
      </section>

      {polls.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <VoteIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No Active Polls</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            There are no live surveys or student council polls running currently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
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
    <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-bold text-sm text-white leading-tight">
          {poll.title}
        </h3>
        {poll.end_date && (
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 border uppercase tracking-wider flex items-center gap-1 ${
            isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20'
          }`}>
            <Clock className="w-2.5 h-2.5" />
            <span>{isExpired ? 'Ended' : 'Live'}</span>
          </span>
        )}
      </div>

      {poll.description && (
        <p className="text-white/60 text-xs font-sans leading-relaxed">
          {poll.description}
        </p>
      )}

      <AnimatePresence mode="wait">
        {!hasVoted ? (
          <form onSubmit={handleVote} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] leading-snug flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              {options.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.99] ${
                    selected === opt
                      ? 'border-orange-burnt bg-orange-burnt/10 text-orange-burnt'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <input
                    type="radio"
                    name={`poll-${poll.id}`}
                    value={opt}
                    checked={selected === opt}
                    onChange={() => setSelected(opt)}
                    className="accent-orange-burnt w-4 h-4"
                  />
                  <span className="text-xs font-display font-bold">{opt}</span>
                </label>
              ))}
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input
                type="email"
                required
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                placeholder="Enter your student email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#050B18]/60 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-colors placeholder-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selected || isExpired}
              className="w-full py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Vote...</span>
                </>
              ) : (
                <>
                  <VoteIcon className="w-3.5 h-3.5" />
                  <span>Cast Vote</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-1"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-xs">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
              <span>{error ? 'Voted' : 'Vote cast successfully!'}</span>
            </div>

            <div className="space-y-3">
              {options.map((opt) => {
                const count = results[opt] || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={opt} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={selected === opt ? 'text-orange-burnt font-bold' : 'text-white/80'}>
                        {opt}
                      </span>
                      <span className="text-orange-burnt text-[10px] font-mono">
                        {pct}% ({count})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          selected === opt ? 'bg-orange-burnt' : 'bg-white/20'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-white/40 text-[9px] font-mono text-right">
              Total votes: {totalVotes}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Vote;
