import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, HelpCircle, Calendar, Trophy, ArrowUpRight } from 'lucide-react';
import { Card, CardBadge } from '../ui/Card';
import { Section, SectionHeader } from './Section';

const quickLinks = [
  {
    title: 'Notice Board',
    desc: 'Official announcements, exam schedules and library timings.',
    icon: FileText,
    link: '/notices',
    badge: 'Notices',
  },
  {
    title: 'Ask the Council',
    desc: 'Submit questions, grievances, or feedback — anonymous or named.',
    icon: HelpCircle,
    link: '/ask',
    badge: 'Ask Portal',
  },
  {
    title: 'Upcoming Events',
    desc: 'History timeline, technical symposiums and cultural festivals.',
    icon: Calendar,
    link: '/events',
    badge: 'Events',
  },
  {
    title: 'Active Competitions',
    desc: 'Register for live challenges, poster events and win prizes.',
    icon: Trophy,
    link: '/events',
    badge: 'Contests',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const HomeQuickLinks: React.FC = () => {
  return (
    <div className="relative z-10 bg-[#080F25]/85 border-y border-white/5 py-24 sm:py-28">
      <Section noPadding className="!py-0">
        <SectionHeader
          eyebrow="Main Dashboard"
          align="center"
          title="Student Resource Hub"
          description="Connect with council operations, check vital exam data, read live alerts or submit a suggestion — all in one place."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7"
        >
          {quickLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} variant="default" padding="lg" hover animate testId={`quicklink-card-${idx}`}>
                <Link to={item.link} className="block h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-11 h-11 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 group-hover:bg-orange-burnt/15 group-hover:border-orange-burnt/35 transition-all">
                        <Icon className="w-5 h-5 text-orange-burnt" strokeWidth={2.2} />
                      </div>
                      <CardBadge tone="gold">{item.badge}</CardBadge>
                    </div>

                    <h3 className="font-display font-extrabold text-base sm:text-lg text-white mb-2 group-hover:text-orange-burnt transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white/55 text-xs sm:text-sm font-sans leading-relaxed mb-6">
                      {item.desc}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-orange-burnt group-hover:text-gold-accent transition-colors uppercase tracking-wider">
                    Explore
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </Card>
            );
          })}
        </motion.div>
      </Section>
    </div>
  );
};

export default HomeQuickLinks;
