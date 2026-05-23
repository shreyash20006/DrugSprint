import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PublicPageShell } from '../components/PublicPageShell';
import { parseJsonArray } from '../lib/parseJson';
import { Vote as VoteIcon, Loader2, CheckCircle } from 'lucide-react';

export const Vote: React.FC = () => {
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: pollData }, { data: voteData }] = await Promise.all([
      supabase.from('polls').select('*').eq('is_active', true).order('end_date'),
      supabase.from('votes').select('*'),
    ]);
    setPolls(pollData || []);
    setVotes(voteData || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const getCounts = (pollId: string, optionCount: number) => {
    const pollVotes = votes.filter((v) => v.poll_id === pollId);
    const counts = Array(optionCount).fill(0);
    pollVotes.forEach((v) => {
      const idx = v.option_index ?? 0;
      if (idx >= 0 && idx < optionCount) counts[idx]++;
    });
    const total = counts.reduce((a, b) => a + b, 0);
    return { counts, total };
  };

  const castVote = async (pollId: string, optionCount: number) => {
    const email = emails[pollId]?.trim().toLowerCase();
    const optionIndex = selected[pollId];
    if (!email || optionIndex === undefined) return;

    setSubmitting(pollId);
    setErrors((e) => ({ ...e, [pollId]: '' }));

    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voter_email', email)
      .maybeSingle();

    if (existing) {
      setErrors((e) => ({ ...e, [pollId]: 'You have already voted!' }));
      setSubmitting(null);
      return;
    }

    const { error } = await supabase.from('votes').insert([
      { poll_id: pollId, voter_email: email, option_index: optionIndex },
    ]);

    if (error) {
      setErrors((e) => ({ ...e, [pollId]: error.message }));
    } else {
      setVotedPolls((s) => new Set(s).add(pollId));
      await load();
    }
    setSubmitting(null);
  };

  return (
    <PublicPageShell
      title="🗳️ Vote Now"
      subtitle="Cast your vote in active council polls"
      icon={<VoteIcon className="w-6 h-6" />}
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-orange-burnt" />
        </div>
      ) : polls.length === 0 ? (
        <p className="text-center text-navy-dark/50 py-16">No active polls right now.</p>
      ) : (
        <div className="space-y-8">
          {polls.map((poll) => {
            const options = parseJsonArray<string>(poll.options);
            const { counts, total } = getCounts(poll.id, options.length);
            const hasVoted = votedPolls.has(poll.id);
            const endDate = poll.end_date
              ? new Date(poll.end_date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';

            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-navy-dark/10 p-6 shadow-sm"
              >
                <h3 className="font-display font-bold text-lg text-navy-dark">{poll.title}</h3>
                {poll.description && (
                  <p className="text-sm text-navy-dark/60 mt-1">{poll.description}</p>
                )}
                <p className="text-xs text-orange-burnt font-semibold mt-2">Ends: {endDate}</p>

                {votedPolls.has(poll.id) ? (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle className="w-4 h-4" /> Vote Cast!
                    </div>
                    {options.map((opt, i) => {
                      const pct = total ? Math.round((counts[i] / total) * 100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>{opt}</span>
                            <span>{pct}% ({counts[i]})</span>
                          </div>
                          <div className="h-2 bg-navy-dark/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-burnt"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-navy-dark/50">Total votes: {total}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {options.map((opt, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg border border-navy-dark/10 cursor-pointer hover:bg-orange-burnt/5"
                      >
                        <input
                          type="radio"
                          name={`poll-${poll.id}`}
                          checked={selected[poll.id] === i}
                          onChange={() => setSelected({ ...selected, [poll.id]: i })}
                        />
                        <span className="text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={emails[poll.id] || ''}
                      onChange={(e) => setEmails({ ...emails, [poll.id]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm mt-2"
                    />
                    {errors[poll.id] && (
                      <p className="text-red-600 text-xs font-semibold">{errors[poll.id]}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => castVote(poll.id, options.length)}
                      disabled={submitting === poll.id}
                      className="w-full py-2.5 bg-orange-burnt text-white font-bold rounded-lg text-sm mt-2"
                    >
                      {submitting === poll.id ? 'Submitting...' : 'Cast Vote →'}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </PublicPageShell>
  );
};

export default Vote;
