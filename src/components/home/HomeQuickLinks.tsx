import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, HelpCircle, Calendar, Trophy,
  ArrowUpRight, Bell, Users,
} from 'lucide-react';
import { Section, SectionHeader } from './Section';

const quickLinks = [
  {
    title: 'Notice Board',
    desc: 'Official announcements, exam schedules, library timings, and important college updates.',
    icon: FileText,
    link: '/notices',
    badge: 'Live Updates',
    gradient: 'from-purple-500/20 to-violet-600/10',
    iconBg: 'from-purple-500 to-violet-600',
    accent: 'group-hover:text-purple-400',
  },
  {
    title: 'Ask the Council',
    desc: 'Submit questions, grievances, or feedback — anonymously or with your name.',
    icon: HelpCircle,
    link: '/ask',
    badge: 'Ask Portal',
    gradient: 'from-amber-500/20 to-orange-600/10',
    iconBg: 'from-amber-500 to-orange-500',
    accent: 'group-hover:text-amber-400',
  },
  {
    title: 'Upcoming Events',
    desc: 'Technical symposiums, cultural festivals, sports events, and academic competitions.',
    icon: Calendar,
    link: '/events',
    badge: 'Events',
    gradient: 'from-emerald-500/20 to-teal-600/10',
    iconBg: 'from-emerald-500 to-teal-500',
    accent: 'group-hover:text-emerald-400',
  },
  {
    title: 'Active Competitions',
    desc: 'Register for live challenges, poster events, and essay contests to win exciting prizes.',
    icon: Trophy,
    link: '/events',
    badge: 'Contests',
    gradient: 'from-rose-500/20 to-pink-600/10',
    iconBg: 'from-rose-500 to-pink-500',
    accent: 'group-hover:text-rose-400',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 220, damping: 22 },
  },
};

export const HomeQuickLinks: React.FC = () => {
  return (
    <div
      className="relative z-10 border-y py-24 sm:py-28"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-30 ambient-orb-orange blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-20 ambient-orb-gold blur-3xl" />
      </div>

      <Section noPadding className="!py-0 relative z-10">
        <SectionHeader
          eyebrow="Student Resource Hub"
          align="center"
          title="Everything You Need"
          description="Connect with council operations, check vital exam data, read live alerts, or submit a suggestion — all in one place."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
        >
          {quickLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div key={idx} variants={cardVariants}>
                <Link
                  to={item.link}
                  className="group bento-card flex flex-col gap-5 h-full relative overflow-hidden"
                  data-testid={`quicklink-card-${idx}`}
                >
                  {/* Card gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-[20px] pointer-events-none`}
                  />

                  {/* Gradient border on hover */}
                  <div className="gradient-border absolute inset-0 rounded-[20px] pointer-events-none" />

                  {/* Top row: icon + badge */}
                  <div className="flex items-start justify-between relative z-10">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon className="w-5.5 h-5.5 text-white" strokeWidth={2} />
                    </div>
                    <span
                      className="badge-base badge-info text-[9px]"
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 relative z-10">
                    <h3
                      className={`font-display font-extrabold text-lg leading-snug mb-2 transition-colors ${item.accent}`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {item.desc}
                    </p>
                  </div>

                  {/* CTA link */}
                  <div className="flex items-center justify-between relative z-10">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wider transition-all ${item.accent}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Explore
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                      style={{ background: 'var(--bg-surface)' }}
                    >
                      <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--pw-purple)' }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional quick stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8"
        >
          {[
            { icon: Bell, label: 'Real-time Notices', color: 'text-purple-400' },
            { icon: Users, label: 'Student Community', color: 'text-amber-400' },
            { icon: Calendar, label: 'Event Reminders', color: 'text-emerald-400' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-semibold font-display">{stat.label}</span>
              </div>
            );
          })}
        </motion.div>
      </Section>
    </div>
  );
};

export default HomeQuickLinks;
