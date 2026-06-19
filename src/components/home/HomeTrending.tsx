import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Eye, Calendar, ArrowUpRight } from 'lucide-react';
import { Card, CardBadge } from '../ui/Card';
import { Section, SectionHeader } from './Section';
import type { HomeNotice } from '../../hooks/useHomePageData';

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
            <Flame className="w-7 h-7 text-orange-burnt animate-pulse" strokeWidth={2.2} />
          </span>
        }
        cta={
          <Link
            to="/notices"
            className="group inline-flex items-center gap-2 text-orange-burnt font-display font-extrabold text-sm hover:text-gold-accent transition-colors"
            data-testid="view-all-notices"
          >
            <span>View All Notices</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trending.map((notice) => (
          <Card key={notice.id} variant="default" padding="lg" hover>
            <Link to="/notices" className="block h-full group">
              <div className="flex items-center justify-between mb-3.5">
                <CardBadge tone="orange">{notice.category}</CardBadge>
                <div className="flex items-center gap-1 text-orange-burnt/85 text-xs font-bold">
                  <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
                  <span>{notice.views || 0}</span>
                </div>
              </div>
              <h3 className="font-display font-bold text-base text-white mb-3 group-hover:text-orange-burnt transition-colors line-clamp-2">
                {notice.title}
              </h3>
              <div className="flex items-center gap-2 text-white/45 text-[10px] uppercase tracking-wider font-bold mt-auto pt-4 border-t border-white/5">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />
                <span>{new Date(notice.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default HomeTrending;
