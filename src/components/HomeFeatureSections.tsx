import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getEventCapacity } from '../lib/eventCapacity';
import { Vote, Trophy, Calendar, ArrowRight, Loader2 } from 'lucide-react';

export const HomeFeatureSections: React.FC = () => {
  const [poll, setPoll] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('polls').select('*').eq('is_active', true).limit(1).maybeSingle(),
      supabase.from('achievements').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').eq('is_active', true).order('deadline').limit(3),
    ]).then(([p, a, e]) => {
      setPoll(p.data);
      setAchievements(a.data || []);
      setEvents(e.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-orange-burnt" />
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
      {poll && (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display font-extrabold text-2xl text-navy-dark mb-6 flex items-center gap-2">
            <Vote className="w-6 h-6 text-orange-burnt" /> 🗳️ Active Polls
          </h2>
          <div className="bg-white rounded-2xl border border-navy-dark/10 p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg">{poll.title}</h3>
            <p className="text-sm text-navy-dark/60 mt-1">{poll.description}</p>
            <Link to="/vote" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-orange-burnt text-white font-bold rounded-lg text-sm">
              Vote Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {achievements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-extrabold text-2xl text-navy-dark flex items-center gap-2">
              <Trophy className="w-6 h-6 text-orange-burnt" /> 🏆 Recent Achievements
            </h2>
            <Link to="/achievements" className="text-sm font-bold text-orange-burnt flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border p-5 shadow-sm">
                <Trophy className="w-5 h-5 text-orange-burnt mb-2" />
                <p className="font-bold text-navy-dark">{a.student_name}</p>
                <p className="text-xs text-orange-burnt font-semibold mt-1">{a.title}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {events.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-extrabold text-2xl text-navy-dark flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-burnt" /> 📅 Upcoming Events
            </h2>
            <Link to="/events" className="text-sm font-bold text-orange-burnt flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((ev) => {
              const { seatsLeft, isFull } = getEventCapacity(ev);
              return (
                <div key={ev.id} className="bg-white rounded-xl border p-5 shadow-sm flex flex-col">
                  <p className="font-display font-bold text-navy-dark">{ev.name}</p>
                  <p className="text-xs text-navy-dark/50 mt-1 line-clamp-2 flex-grow">{ev.description}</p>
                  {ev.capacity > 0 && (
                    <p className={`text-xs font-bold mt-2 ${isFull ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isFull ? '🔴 Full' : `🟢 ${seatsLeft} seats left`}
                    </p>
                  )}
                  <Link
                    to={`/register/${ev.id}`}
                    className="mt-3 text-center py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg"
                  >
                    Register Now
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default HomeFeatureSections;
