import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DNAHero } from '../components/DNAHero';
import { ScienceBackground } from '../components/ScienceBackground';
import { MarqueeStrip } from '../components/MarqueeStrip';
import { supabase } from '../lib/supabase';
import {
  FileText,
  HelpCircle,
  Calendar,
  Trophy,
  Users,
  Award,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  Megaphone,
  Eye
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  academic: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  sports: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  cultural: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  research: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  competition: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

// Custom interactive count-up counter
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({ target, suffix = '', duration = 1.2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;

    const totalMilliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / end), 16);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMilliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const Home: React.FC = () => {
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pollVotes, setPollVotes] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [votingEmail, setVotingEmail] = useState<string>('');
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);

  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [trendingNotices, setTrendingNotices] = useState<any[]>([]);
  
  // Real-time counter metrics
  const [noticesCount, setNoticesCount] = useState<number>(14);
  const [eventsCount, setEventsCount] = useState<number>(9);

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { data: pollData } = await supabase
          .from('polls')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pollData) {
          setActivePoll(pollData);
          const votedPolls = JSON.parse(localStorage.getItem('tgpcop_voted_polls') || '[]');
          if (votedPolls.includes(pollData.id)) {
            setHasVoted(true);
          }
          
          const { data: votesData } = await supabase
            .from('votes')
            .select('selected_option')
            .eq('poll_id', pollData.id);
          
          setPollVotes(votesData || []);
        }
      } catch (err) {
        console.error('Error fetching home active poll:', err);
      }
    };

    const fetchAchievementsAndEvents = async () => {
      try {
        const { data: achievements } = await supabase
          .from('achievements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        setRecentAchievements(achievements || []);

        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('deadline', { ascending: true })
          .limit(3);
        setUpcomingEvents(events || []);

        // Query direct database counts dynamically to populate stats counters
        const { count: nVal } = await supabase.from('notices').select('*', { count: 'exact', head: true });
        if (nVal !== null) setNoticesCount(nVal);

        const { count: eVal } = await supabase.from('events').select('*', { count: 'exact', head: true });
        if (eVal !== null) setEventsCount(eVal);

        // Fetch Trending Notices safely (fallback if views column not yet created)
        try {
          const { data: trending } = await supabase
            .from('notices')
            .select('*')
            .order('views', { ascending: false })
            .limit(3);
          if (trending) setTrendingNotices(trending);
        } catch (e) {
          console.warn("Views column may not exist yet, skipping trending notices fetch.");
        }

      } catch (err) {
        console.error('Error fetching home achievements/events:', err);
      }
    };

    fetchPollData();
    fetchAchievementsAndEvents();
  }, []);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePoll || !selectedOption || !votingEmail) return;

    setIsSubmittingVote(true);
    try {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', activePoll.id)
        .eq('email', votingEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingVote) {
        alert('You have already voted in this poll with this email!');
        const votedPolls = JSON.parse(localStorage.getItem('tgpcop_voted_polls') || '[]');
        if (!votedPolls.includes(activePoll.id)) {
          votedPolls.push(activePoll.id);
          localStorage.setItem('tgpcop_voted_polls', JSON.stringify(votedPolls));
        }
        setHasVoted(true);
        setIsSubmittingVote(false);
        return;
      }

      const { error } = await supabase.from('votes').insert({
        poll_id: activePoll.id,
        email: votingEmail.trim().toLowerCase(),
        selected_option: selectedOption,
      });

      if (error) throw error;

      const votedPolls = JSON.parse(localStorage.getItem('tgpcop_voted_polls') || '[]');
      votedPolls.push(activePoll.id);
      localStorage.setItem('tgpcop_voted_polls', JSON.stringify(votedPolls));

      setHasVoted(true);
      
      const { data: votesData } = await supabase
        .from('votes')
        .select('selected_option')
        .eq('poll_id', activePoll.id);
      setPollVotes(votesData || []);

    } catch (err: any) {
      console.error('Error casting vote:', err.message);
      alert('Failed to cast vote: ' + err.message);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const getOptionPercentage = (option: string) => {
    if (pollVotes.length === 0) return 0;
    const matchCount = pollVotes.filter(v => v.selected_option === option).length;
    return Math.round((matchCount / pollVotes.length) * 100);
  };

  const getOptionVotes = (option: string) => {
    return pollVotes.filter(v => v.selected_option === option).length;
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 90,
        damping: 16,
      },
    },
  };

  const quickLinks = [
    {
      title: 'Notice Board',
      desc: 'Access official announcements, mid-sem exam schedules, and library timing notices.',
      icon: <FileText className="w-6 h-6 text-orange-burnt" />,
      link: '/notices',
      badge: 'Notices',
    },
    {
      title: 'Ask the Council',
      desc: 'Submit direct questions, grievances, or feedback anonymous or named to any member.',
      icon: <HelpCircle className="w-6 h-6 text-orange-burnt" />,
      link: '/ask',
      badge: 'Ask Portal',
    },
    {
      title: 'Upcoming Events',
      desc: 'View our dynamic history timeline, technical symposiums, and cultural festivals.',
      icon: <Calendar className="w-6 h-6 text-orange-burnt" />,
      link: '/events',
      badge: 'Events',
    },
    {
      title: 'Active Competitions',
      desc: 'Register for live drug delivery challenges, scientific poster events, and win prizes.',
      icon: <Trophy className="w-6 h-6 text-orange-burnt" />,
      link: '/events',
      badge: 'Contests',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-20">
      <ScienceBackground />
      {/* Dynamic colorful floating gradient HSL orbs */}
      <div className="absolute top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />

      {/* Tech grid mesh overlay */}
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* 1. Hero Canvas */}
      <DNAHero />

      {/* 2. Dynamic Notices Infinite Marquee */}
      <MarqueeStrip />

      {/* 3. About the Council (Responsive 2-Column Grid) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
        >
          {/* Left Description Column */}
          <motion.div variants={fadeUpVariants} className="lg:col-span-7 space-y-6">
            <div className="flex items-center space-x-2 text-orange-burnt text-xs font-extrabold uppercase tracking-widest">
              <span className="w-6 h-[1.5px] bg-orange-burnt" />
              <span>Who We Are</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
              Leading the Pharmacy Pioneers <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent">
                Towards Academic & Social Excellence
              </span>
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
              The Student Council of Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP), Nagpur serves as the official liaison between students and the faculty administration. We represent the unified voice of 500+ aspiring pharmacists, striving to cultivate an energetic campus culture that balances intensive scientific research with rich creative talents.
            </p>
            <p className="text-white/75 text-sm sm:text-base leading-relaxed font-sans">
              Whether conducting rural healthcare blood donation camps, organizing technological symposiums like 'AURA', maintaining strict zero-tolerance anti-ragging networks, or uploading syllabus materials to NotesDrive — the TGPCOP Student Council is fully committed to together safeguarding your academic future.
            </p>
            <div className="pt-4">
              <Link
                to="/council"
                className="inline-flex items-center space-x-2 text-orange-burnt font-display font-extrabold text-sm hover:text-white transition-colors group"
              >
                <span>Meet the Student Leaders</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right Statistics Section with glowing interactive counters */}
          <motion.div variants={fadeUpVariants} className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 w-full">
            {[
              {
                value: 500,
                label: 'Total Students',
                desc: 'Aspiring pharmacists representing unified student leadership at Nagpur.',
                icon: <Users className="w-5 h-5 text-white" />,
                suffix: '+'
              },
              {
                value: noticesCount,
                label: 'Notices Published',
                desc: 'Stay informed with official examination schedules and administrative alerts.',
                icon: <Megaphone className="w-5 h-5 text-white" />,
                suffix: ''
              },
              {
                value: eventsCount,
                label: 'Events Conducted',
                desc: 'Educational symposiums, research forums, and dynamic cultural drives.',
                icon: <Calendar className="w-5 h-5 text-white" />,
                suffix: ''
              },
              {
                value: 13,
                label: 'Active Members',
                desc: 'Elected council executives representing semesters and student welfare.',
                icon: <Award className="w-5 h-5 text-white" />,
                suffix: ''
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl p-6 shadow-[0_8px_32px_rgba(5,11,24,0.4)] flex items-start space-x-4 transition-all duration-300 hover:border-orange-burnt/40"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-burnt/15">
                  {stat.icon}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-3xl text-white leading-none mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </h3>
                  <h4 className="font-display font-extrabold text-xs text-orange-burnt uppercase tracking-wider mb-2">
                    {stat.label}
                  </h4>
                  <p className="text-white/60 text-xs leading-relaxed font-sans">
                    {stat.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* 4. Quick Links Cards (Resource Hub Dashboard) */}
      <section className="relative z-10 bg-[#080F25]/85 border-y border-white/5 py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="bg-orange-burnt/10 border border-orange-burnt/35 text-orange-burnt text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md">
              Main Dashboard
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white">
              Student Resource Hub
            </h2>
            <p className="text-white/60 text-sm sm:text-base font-sans leading-relaxed">
              Connect with council operations, check vital examinations data, read active alerts, or submit a suggestion instantly.
            </p>
          </div>

          {/* Cards Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {quickLinks.map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUpVariants}
                whileHover={{
                  y: -8,
                  borderColor: 'rgba(200, 75, 14, 0.45)',
                  boxShadow: '0 20px 40px -15px rgba(200, 75, 14, 0.25)',
                }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer relative group shadow-[0_8px_32px_rgba(5,11,24,0.4)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-orange-burnt/10 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-gold-accent px-2.5 py-0.5 rounded-full border border-gold-accent/25 bg-gold-accent/5">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white mb-2 group-hover:text-orange-burnt transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-white/55 text-xs sm:text-sm font-sans leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <Link
                  to={item.link}
                  className="inline-flex items-center space-x-1.5 text-xs font-display font-bold text-orange-burnt group-hover:text-gold-accent transition-colors"
                >
                  <span>Explore Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. Active Poll Section (Glassmorphic Voter Panel) */}
      {activePoll && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(5,11,24,0.4)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-burnt/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Info Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center space-x-2 text-orange-burnt text-xs font-bold uppercase tracking-widest bg-orange-burnt/10 px-3 py-1 rounded-full border border-orange-burnt/25">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Student Voting</span>
                </div>
                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white leading-tight">
                  {activePoll.title}
                </h2>
                {activePoll.description && (
                  <p className="text-white/65 text-sm sm:text-base font-sans leading-relaxed">
                    {activePoll.description}
                  </p>
                )}
                <div className="flex items-center space-x-3 text-white/45 text-xs font-sans">
                  <span className="flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-1" /> {pollVotes.length} total votes</span>
                  {activePoll.end_date && (
                    <>
                      <span>•</span>
                      <span>Ends on: {new Date(activePoll.end_date).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Interactive Form/Results Column */}
              <div className="lg:col-span-6">
                {hasVoted ? (
                  <div className="bg-[#050B18]/60 border border-orange-burnt/20 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center space-x-2 text-emerald-400 font-display font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Thank you! Your voice has been recorded.</span>
                    </div>
                    
                    <div className="space-y-4">
                      {(activePoll.options || []).map((opt: string) => {
                        const pct = getOptionPercentage(opt);
                        const votes = getOptionVotes(opt);
                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-white">
                              <span>{opt}</span>
                              <span className="text-orange-burnt">{pct}% ({votes} votes)</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-orange-burnt to-gold-accent rounded-full shadow-lg"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVoteSubmit} className="space-y-4">
                    <div className="space-y-3">
                      {(activePoll.options || []).map((opt: string) => (
                        <label
                          key={opt}
                          className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedOption === opt
                              ? 'border-orange-burnt bg-orange-burnt/10 text-orange-burnt shadow-lg shadow-orange-burnt/5'
                              : 'border-white/10 hover:border-orange-burnt/30 text-white/80 bg-white/5 hover:bg-white/10'
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
                        disabled={isSubmittingVote || !selectedOption}
                        className="px-6 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:scale-102 hover:shadow-orange-burnt/20 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50 transition-all active:scale-98 shrink-0 border border-white/5"
                      >
                        {isSubmittingVote ? 'Voting...' : 'Cast Vote'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Notices Section */}
      {trendingNotices.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-orange-burnt text-xs font-extrabold uppercase tracking-widest">
                <span className="w-6 h-[1.5px] bg-orange-burnt" />
                <span>Most Viewed</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white flex items-center space-x-3">
                <span>Trending Notices</span>
                <span className="text-orange-burnt animate-pulse">🔥</span>
              </h2>
            </div>
            <Link
              to="/notices"
              className="inline-flex items-center space-x-2 text-orange-burnt font-display font-extrabold hover:text-white transition-colors group mt-4 md:mt-0"
            >
              <span>View All Notices</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingNotices.map((notice) => (
              <Link
                key={notice.id}
                to="/notices"
                className="bg-[#0D1B3E]/85 border border-orange-burnt/15 hover:border-orange-burnt/40 backdrop-blur-[16px] rounded-2xl p-6 flex flex-col transition-all duration-300 shadow-lg hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-orange-burnt/10 text-orange-burnt border-orange-burnt/25">
                    {notice.category}
                  </span>
                  <div className="flex items-center space-x-1 text-orange-burnt/80 text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{notice.views || 0}</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-base text-white mb-2 group-hover:text-orange-burnt transition-colors line-clamp-2">
                  {notice.title}
                </h3>
                <div className="flex items-center space-x-2 text-white/40 text-[10px] uppercase tracking-wider font-bold mt-auto pt-4 border-t border-white/5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Recent Achievements Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-white/5">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-orange-burnt text-xs font-extrabold uppercase tracking-widest">
              <span className="w-6 h-[1.5px] bg-orange-burnt" />
              <span>Hall of Fame</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white">
              Celebrating Student Triumphs
            </h2>
            <p className="text-white/60 text-xs sm:text-sm font-sans max-w-lg">
              Recognizing our brightest minds and active game-changers making us proud inside and outside Nagpur.
            </p>
          </div>
          <Link
            to="/achievements"
            className="inline-flex items-center space-x-2 text-orange-burnt font-display font-extrabold hover:text-white transition-colors group mt-4 md:mt-0"
          >
            <span>View Achievements Wall</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {recentAchievements.length === 0 ? (
          <div className="text-center py-16 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-[0_8px_32px_rgba(5,11,24,0.4)]">
            <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/40 text-sm">No achievements posted yet</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentAchievements.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -6, borderColor: 'rgba(200, 75, 14, 0.4)', boxShadow: '0 20px 40px -15px rgba(200, 75, 14, 0.2)' }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-[0_8px_32px_rgba(5,11,24,0.4)]"
              >
                {item.image_url ? (
                  <div className="h-48 overflow-hidden relative border-b border-white/5">
                    <img src={item.image_url} alt={item.student_name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-white/5 to-orange-burnt/10 flex items-center justify-center border-b border-white/5">
                    <Trophy className="w-12 h-12 text-orange-burnt/40" />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category?.toLowerCase()] || 'bg-white/5 text-white/60 border-white/10'}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white mb-1">{item.student_name}</h3>
                  <div className="flex items-center space-x-1.5 text-white/50 text-xs mb-3">
                    <GraduationCap className="w-4 h-4 text-orange-burnt" />
                    <span>{item.year}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-display font-semibold text-orange-burnt mb-2">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-white/60 font-sans leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 7. Upcoming Events Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-orange-burnt text-xs font-bold uppercase tracking-widest">
              <span className="w-6 h-[1.5px] bg-orange-burnt" />
              <span>What's Next</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white">
              Upcoming Events & Competitions
            </h2>
            <p className="text-white/60 text-xs sm:text-sm font-sans max-w-lg">
              Block your dates! Join active scientific quizzes, cultural drives, or sports symposiums happening on campus.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center space-x-2 text-orange-burnt font-display font-extrabold hover:text-white transition-colors group mt-4 md:mt-0"
          >
            <span>Explore Events Timeline</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-16 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-[0_8px_32px_rgba(5,11,24,0.4)]">
            <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/40 text-sm">No upcoming events scheduled</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => {
              const seatsLeft = (event.capacity || 100) - (event.registered_count || 0);
              const isFull = seatsLeft <= 0;
              const progressPct = Math.min(100, ((event.registered_count || 0) / (event.capacity || 100)) * 100);

              return (
                <div
                  key={event.id}
                  className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-orange-burnt/40 shadow-[0_8px_32px_rgba(5,11,24,0.4)] hover:shadow-[0_20px_40px_-15px_rgba(200,75,14,0.15)]"
                >
                  <div>
                    {/* Header Image/Banner */}
                    <div className="h-44 bg-[#080F25] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#080F25] via-[#0D1B3E] to-orange-burnt/10 flex flex-col p-6 justify-between">
                          <span className="text-[10px] font-extrabold tracking-widest text-orange-burnt uppercase border border-orange-burnt/35 rounded-full px-3 py-1 self-start">
                            {event.type === 'competition' ? '🏆 Competition' : '📅 Event'}
                          </span>
                          <span className="text-white font-display font-bold text-base sm:text-lg leading-tight line-clamp-2">
                            {event.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Meta stats */}
                      <div className="space-y-2.5 text-xs text-white/60 font-sans">
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="w-4 h-4 text-orange-burnt shrink-0" />
                          <span>{event.deadline ? new Date(event.deadline).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'TBA'}</span>
                        </div>
                        {event.time && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-orange-burnt shrink-0" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-orange-burnt shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Capacity progress bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between items-center text-[10px] font-semibold">
                          <span className={`${isFull ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                            {isFull ? '🔴 House Full' : `🟢 ${seatsLeft} seats left`}
                          </span>
                          <span className="text-white/45">Capacity: {event.capacity || 100}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                             style={{ width: `${progressPct}%` }}
                             className={`h-full rounded-full transition-all duration-500 ${
                               isFull ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                             }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      to={`/register/${event.id}`}
                      className={`w-full text-center py-3 rounded-xl font-display text-xs font-bold uppercase tracking-wider transition-all block border border-white/5 ${
                        isFull
                          ? 'bg-white/5 text-white/30 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:scale-102 text-white shadow-lg shadow-orange-burnt/10 active:scale-98 hover:shadow-orange-burnt/20'
                      }`}
                      onClick={(e) => {
                        if (isFull) e.preventDefault();
                      }}
                    >
                      {isFull ? 'Sold Out' : 'Register Now →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
