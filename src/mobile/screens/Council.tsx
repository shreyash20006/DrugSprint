import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, HelpCircle, User, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { councilMembers, type CouncilMember } from '../../data/council';
import { useNavigate } from 'react-router-dom';

export const Council: React.FC = () => {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_suspended', false);

        if (error) throw error;

        const dbProfilesMap = new Map<string, any>();
        (dbProfiles || []).forEach(p => {
          if (p.email) dbProfilesMap.set(p.email.toLowerCase(), p);
        });

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

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Roster & Leaders
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Student Council Directory
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Connect with your elected representatives and student coordinators representing B.Pharm, D.Pharm, and M.Pharm programs.
        </p>
      </section>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name or role..."
          className="w-full pl-11 pr-4 py-3 bg-[#0F1E42]/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/25"
        />
      </div>

      {/* Roster Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0F1E42]/80 border border-white/10 rounded-2xl p-5 h-44 relative overflow-hidden">
              <div className="absolute inset-0 shimmer pointer-events-none" />
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-xs font-sans">
          No council members found matching your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <motion.div
              key={`${member.email}-${member.name}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center overflow-hidden">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : member.avatarSeed ? (
                      <span className="text-sm font-bold text-orange-burnt">{member.avatarSeed}</span>
                    ) : (
                      <User className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  {/* Name & Role */}
                  <div>
                    <span className="text-[9px] font-bold text-orange-burnt uppercase tracking-widest block">
                      {member.role}
                    </span>
                    <h3 className="font-display font-bold text-sm text-white mt-0.5">
                      {member.name}
                    </h3>
                  </div>
                </div>

                <span className="bg-white/5 border border-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {member.year}
                </span>
              </div>

              {/* Contact Information */}
              {(member.email || member.phone) && (
                <div className="text-[10px] text-white/50 space-y-1 font-sans border-t border-white/5 pt-3">
                  {member.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span>📧</span> <span>{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-1.5">
                      <span>📞</span> <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => navigate(`/ask?to=${encodeURIComponent(member.name)}`)}
                className="w-full py-2.5 bg-orange-burnt/10 hover:bg-orange-burnt text-orange-burnt hover:text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-orange-burnt/25 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask Question</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Council;
