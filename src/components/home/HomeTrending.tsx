import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Eye, Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Section, SectionHeader } from './Section';
import type { HomeNotice } from '../../hooks/useHomePageData';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 240, damping: 22 },
  },
};

export const HomeTrending: React.FC<{ trending: HomeNotice[] }> = ({ trending }) => {
  if (trending.length === 0) return null;

  return (
    <Section>
      <SectionHeader
        eyebrow="Most Viewed"
        align="between"
        title={
          <span className="inline-flex items-center gap-3">
            Trending Notices
            <Flame className="w-6 h-6 text-orange-burnt animate-pulse" strokeWidth={2.2} />
          </span>
        }
        cta={
          <Link
            to="/notices"
            className="group inline-flex items-center gap-1.5 font-display font-extrabold text-sm transition-colors text-orange-burnt hover:text-gold-accent"
            data-testid="view-all-notices"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {trending.map((notice, idx) => (
          <motion.div key={notice.id} variants={itemVariants}>
            <Link to="/notices" className="block h-full group">
              <div
                className="content-card h-full flex flex-col gap-3 p-5 transition-all duration-250 hover:border-orange-burnt/30"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {/* Top row: category badge + view count */}
                <div className="flex items-center justify-between">
                  <span
                    className="badge-base badge-orange badge-dot"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {notice.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    <Eye className="w-3 h-3" strokeWidth={2.2} />
                    <span>{notice.views || 0}</span>
                  </div>
                </div>

                {/* Urgency indicator for recent items (< 2 days) */}
                {(() => {
                  const diffDays = Math.floor(
                    (Date.now() - new Date(notice.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return diffDays < 2 ? (
                    <span className="live-indicator text-[9px]">New</span>
                  ) : null;
                })()}

                {/* Title */}
                <h3
                  className="font-display font-bold text-sm leading-snug line-clamp-2 group-hover:text-orange-burnt transition-colors flex-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {notice.title}
                </h3>

                {/* Footer: date + trending rank */}
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                    <Calendar className="w-3 h-3" strokeWidth={2.4} />
                    <span>{formatDate(notice.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-burnt">
                    <TrendingUp className="w-3 h-3" />
                    <span>#{idx + 1}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
};

export default HomeTrending;
