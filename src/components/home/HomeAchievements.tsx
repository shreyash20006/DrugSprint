import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, GraduationCap, ArrowUpRight } from 'lucide-react';
import { Card, CardBadge } from '../ui/Card';
import { Section, SectionHeader } from './Section';
import type { HomeAchievement } from '../../hooks/useHomePageData';

const CATEGORY_TONES: Record<string, 'orange' | 'gold' | 'emerald' | 'neutral'> = {
  academic: 'gold',
  sports: 'emerald',
  cultural: 'orange',
  research: 'gold',
  competition: 'orange',
};

const itemFade = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export const HomeAchievements: React.FC<{ achievements: HomeAchievement[] }> = ({ achievements }) => {
  return (
    <Section className="border-b border-white/5">
      <SectionHeader
        eyebrow="Hall of Fame"
        align="between"
        title="Celebrating Student Triumphs"
        description="Recognizing our brightest minds and active game-changers making us proud across India."
        cta={
          <Link
            to="/achievements"
            className="group inline-flex items-center gap-2 text-orange-burnt font-display font-extrabold text-sm hover:text-gold-accent transition-colors"
            data-testid="view-all-achievements"
          >
            <span>View Achievements Wall</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />

      {achievements.length === 0 ? (
        <Card variant="default" padding="xl" className="text-center">
          <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" strokeWidth={1.6} />
          <h3 className="font-display font-bold text-white/40 text-sm">No achievements posted yet</h3>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {achievements.map((item) => (
            <motion.div
              key={item.id}
              variants={itemFade}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <Card variant="default" padding="none" hover className="flex flex-col h-full">
                {item.image_url ? (
                  <div className="h-48 overflow-hidden relative border-b border-white/5">
                    <img
                      src={item.image_url}
                      alt={item.student_name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-white/[0.04] to-orange-burnt/10 flex items-center justify-center border-b border-white/5">
                    <Trophy className="w-12 h-12 text-orange-burnt/40" strokeWidth={1.6} />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-3.5">
                    {item.category && (
                      <CardBadge tone={CATEGORY_TONES[item.category?.toLowerCase()] || 'neutral'}>
                        {item.category}
                      </CardBadge>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mb-1">{item.student_name}</h3>
                  {item.year && (
                    <div className="flex items-center gap-1.5 text-white/50 text-xs mb-3">
                      <GraduationCap className="w-4 h-4 text-orange-burnt" strokeWidth={2.2} />
                      <span>{item.year}</span>
                    </div>
                  )}
                  <p className="text-sm font-display font-semibold text-orange-burnt mb-2">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-white/60 font-sans leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
};

export default HomeAchievements;
