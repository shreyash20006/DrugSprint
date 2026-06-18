import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CouncilCard } from '../components/CouncilCard';
import { councilMembers, type CouncilMember } from '../data/council';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const Council: React.FC = () => {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_suspended', false);

        if (error) throw error;

        // Map live database profiles by email
        const dbProfilesMap = new Map<string, any>();
        (dbProfiles || []).forEach(p => {
          if (p.email) dbProfilesMap.set(p.email.toLowerCase(), p);
        });

        // Merge live data on top of static council roster
        const merged = councilMembers.map(staticMember => {
          const dbProf = dbProfilesMap.get(staticMember.email.toLowerCase());
          if (dbProf) {
            return {
              ...staticMember,
              name: dbProf.name || staticMember.name,
              year: dbProf.year || staticMember.year,
              avatarUrl: dbProf.avatar_url || undefined,
              phone: dbProf.phone || undefined,
              email: dbProf.email || staticMember.email,
            };
          }
          return staticMember;
        });

        // Dynamically append any new database council profiles not present in the static fallback
        const staticEmails = new Set(councilMembers.map(m => m.email.toLowerCase()));
        (dbProfiles || []).forEach(p => {
          const emailLower = p.email?.toLowerCase();
          if (emailLower && !staticEmails.has(emailLower) && p.name) {
            const displayRole = p.role ? p.role.replace('_', ' ').toUpperCase() : 'COUNCIL MEMBER';
            merged.push({
              role: displayRole,
              name: p.name,
              year: p.year || 'Council Member',
              email: p.email,
              avatarSeed: p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              avatarUrl: p.avatar_url || undefined,
              phone: p.phone || undefined,
            });
          }
        });

        setMembers(merged);
      } catch (err) {
        console.error('Error fetching dynamic council profiles:', err);
        setMembers(councilMembers);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchMembers();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const gridContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={<ShieldCheck className="w-6 h-6 animate-pulse" />}
        title="Student Council"
        subtitle="Meet your elected leaders representing academic, cultural, sports, and student welfare across TGPCOP"
        breadcrumb="Council"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">

        {/* Shimmer Skeleton Loaders */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="glass-panel rounded-2xl p-6 flex flex-col justify-between border border-white/5 h-64 overflow-hidden relative"
              >
                <div className="absolute inset-0 shimmer pointer-events-none" />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10" />
                  <div className="w-20 h-5 bg-white/5 rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="w-24 h-4 bg-white/5 rounded" />
                  <div className="w-40 h-6 bg-white/5 rounded" />
                </div>
                <div className="w-full h-10 bg-white/5 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {members.map((member) => (
              <CouncilCard key={`${member.email}-${member.name}`} member={member} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Council;
