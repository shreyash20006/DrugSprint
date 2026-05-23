import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/HeroSection';
import { MarqueeStrip } from '../components/MarqueeStrip';
import { HomeFeatureSections } from '../components/HomeFeatureSections';
import {
  FileText,
  HelpCircle,
  Calendar,
  Trophy,
  Users,
  Award,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const Home: React.FC = () => {
  // Stagger Container
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Fade Up Elements
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 45 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 15,
      },
    },
  };

  const quickLinks = [
    {
      title: 'Notice Board',
      desc: 'Access official announcements, mid-sem exam schedules, and library timing notices.',
      icon: <FileText className="w-8 h-8 text-orange-burnt" />,
      link: '/notices',
      badge: 'Notices',
    },
    {
      title: 'Ask the Council',
      desc: 'Submit direct questions, grievances, or feedback anonymous or named to any member.',
      icon: <HelpCircle className="w-8 h-8 text-orange-burnt" />,
      link: '/ask',
      badge: 'Ask Portal',
    },
    {
      title: 'Upcoming Events',
      desc: 'View our dynamic history timeline, technical symposiums, and cultural festivals.',
      icon: <Calendar className="w-8 h-8 text-orange-burnt" />,
      link: '/events',
      badge: 'Events',
    },
    {
      title: 'Active Competitions',
      desc: 'Register for live drug delivery challenges, scientific poster events, and win prizes.',
      icon: <Trophy className="w-8 h-8 text-orange-burnt" />,
      link: '/events',
      badge: 'Contests',
    },
  ];

  return (
    <div className="w-full pb-20">
      {/* 1. Hero Canvas */}
      <HeroSection />

      {/* 2. Horizontal Marquee Announcements */}
      <MarqueeStrip />

      <HomeFeatureSections />

      {/* 3. About the Council (2-Column Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
        >
          {/* Left Text Column */}
          <motion.div variants={fadeUpVariants} className="lg:col-span-7 space-y-6">
            <div className="flex items-center space-x-2 text-orange-burnt text-xs font-bold uppercase tracking-widest">
              <span className="w-6 h-[1.5px] bg-orange-burnt" />
              <span>Who We Are</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-dark leading-tight">
              Leading the Pharmacy Pioneers <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent">
                Towards Academic & Social Excellence
              </span>
            </h2>
            <p className="text-navy-dark/80 text-sm sm:text-base leading-relaxed font-sans">
              The Student Council of Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP), Nagpur serves as the official liaison between students and the faculty administration. We represent the unified voice of 500+ aspiring pharmacists, striving to cultivate an energetic campus culture that balances intensive scientific research with rich creative talents.
            </p>
            <p className="text-navy-dark/85 text-sm sm:text-base leading-relaxed font-sans">
              Whether conducting rural healthcare blood donation camps, organizing technological symposiums like 'AURA', maintaining strict zero-tolerance anti-ragging networks, or uploading syllabus materials to NotesDrive — the TGPCOP Student Council is fully committed to together safeguarding your academic future.
            </p>
            <div className="pt-4">
              <Link
                to="/council"
                className="inline-flex items-center space-x-2 text-orange-burnt font-display font-bold hover:text-navy-dark transition-colors group"
              >
                <span>Meet the Student Leaders</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right Stats Column (Animated glass grid) */}
          <motion.div variants={fadeUpVariants} className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6 w-full">
            {[
              {
                value: '13',
                label: 'Council Members',
                desc: 'Elected student executives across B.Pharm and D.Pharm courses.',
                icon: <Users className="w-6 h-6 text-white" />,
              },
              {
                value: '3+',
                label: 'Consecutive Years',
                desc: 'Continuous dedicated administration, sports drives, and technical festivals.',
                icon: <Award className="w-6 h-6 text-white" />,
              },
              {
                value: '500+',
                label: 'Students Represented',
                desc: 'Championing interests, resolving academic grievances, and driving leadership.',
                icon: <ShieldAlert className="w-6 h-6 text-white" />,
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-panel hover:bg-white border border-white/50 rounded-2xl p-6 shadow-md flex items-start space-x-4 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-burnt flex items-center justify-center text-white shadow-md shadow-orange-burnt/15 shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-3xl text-navy-dark leading-none mb-1">
                    {stat.value}
                  </h3>
                  <h4 className="font-display font-bold text-sm text-orange-burnt leading-none mb-1.5">
                    {stat.label}
                  </h4>
                  <p className="text-navy-dark/60 text-xs leading-relaxed font-sans">
                    {stat.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* 4. Quick Links Cards (Staggered Grid) */}
      <section className="bg-navy-dark text-white py-24 relative overflow-hidden">
        {/* Dynamic chemistry background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] opacity-25 pointer-events-none" />
        <div className="absolute -left-10 top-1/4 w-72 h-72 bg-orange-burnt/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="bg-orange-burnt/10 border border-orange-burnt/30 text-orange-burnt text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              Main Dashboard
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              Student Resource Hub
            </h2>
            <p className="text-white/70 text-sm sm:text-base font-sans">
              Connect with council operations, check vital examinations data, read active alerts, or submit a suggestion instantly.
            </p>
          </div>

          {/* Cards Grid Track */}
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
                  boxShadow: '0 20px 30px -10px rgba(200, 75, 14, 0.15)',
                }}
                className="glass-panel-dark hover:bg-navy-dark hover:border-orange-burnt/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative group border border-white/5 cursor-pointer"
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gold-accent px-2 py-0.5 rounded-full border border-gold-accent/20 bg-gold-accent/5">
                      {item.badge}
                    </span>
                  </div>

                  {/* Text details */}
                  <h3 className="font-display font-bold text-lg text-white mb-2 group-hover:text-orange-burnt transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm font-sans leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                {/* Routing Action Link */}
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
    </div>
  );
};

export default Home;
