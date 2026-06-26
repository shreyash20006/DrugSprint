import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, BookOpen, Award, Users, FileText, Download,
  Search, ChevronRight, Star, Clock, Tag,
  Sparkles, GraduationCap, Ticket, BadgeCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Events: Calendar,
  Workshops: BookOpen,
  Seminars: Sparkles,
  Conferences: Award,
  Membership: Users,
  Certificates: FileText,
  'Study Materials': Download,
  'Digital Downloads': Download,
  'Academic Services': GraduationCap,
  Others: Tag,
};

const CATEGORY_COLORS: Record<string, string> = {
  Events:            'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Workshops:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Seminars:          'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Conferences:       'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Membership:        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Certificates:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Study Materials': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Digital Downloads':'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Academic Services':'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Others:            'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const CATEGORIES = ['All', 'Events', 'Workshops', 'Seminars', 'Conferences', 'Membership', 'Certificates', 'Study Materials', 'Digital Downloads', 'Academic Services', 'Others'];

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .neq('status', 'draft')
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();

    // Realtime sync
    const channel = supabase
      .channel('services_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchServices)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchSearch = !searchQuery ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'All' || s.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [services, searchQuery, activeCategory]);

  const getStatusBadge = (service: any) => {
    if (service.status === 'sold_out' || (service.max_seats && service.registered_count >= service.max_seats)) {
      return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-red-500/15 text-red-400 border border-red-500/25">Sold Out</span>;
    }
    if (service.status === 'closed') {
      return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/25">Closed</span>;
    }
    if (service.status === 'upcoming') {
      return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">Upcoming</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Open</span>;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--pw-purple)]/10 border border-[var(--pw-purple)]/25 text-[var(--pw-purple)] text-[10px] font-bold uppercase tracking-widest mb-3">
            <Ticket className="w-3 h-3" /> Student Services Portal
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[var(--text-primary)] leading-tight mb-3">
            Services & Registrations
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
            Register for college events, workshops, seminars, purchase study materials, and access all student academic services in one place.
          </p>
        </motion.div>

        {/* Search + Filter */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search services, events, workshops..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--pw-purple)] transition-colors text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-display text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-[var(--pw-purple)] text-white shadow-md'
                    : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-[var(--bg-surface)]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[var(--bg-surface)] rounded w-1/3" />
                  <div className="h-5 bg-[var(--bg-surface)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-surface)] rounded w-full" />
                  <div className="h-10 bg-[var(--bg-surface)] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-[var(--border-subtle)] rounded-2xl">
            <Ticket className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-2">No services found</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              {searchQuery ? `No results for "${searchQuery}"` : 'No services are available in this category right now.'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((service, idx) => {
                const CatIcon = CATEGORY_ICONS[service.category] || Tag;
                const catColor = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.Others;
                const isFree = !service.price || service.price === 0;
                const seatsLeft = service.max_seats ? service.max_seats - (service.registered_count || 0) : null;
                const isClosed = service.status === 'closed' || service.status === 'sold_out' ||
                  (service.max_seats && service.registered_count >= service.max_seats);

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden flex flex-col hover:shadow-[var(--card-shadow-hover)] transition-all group"
                    style={{ boxShadow: 'var(--card-shadow)' }}
                  >
                    {/* Image / Banner */}
                    <div className="relative h-48 bg-[var(--bg-surface)] overflow-hidden">
                      {service.thumbnail || service.banner_image ? (
                        <img
                          src={service.thumbnail || service.banner_image}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--pw-purple)]/10 to-[var(--bg-surface)]">
                          <CatIcon className="w-16 h-16 text-[var(--pw-purple)]/30" />
                        </div>
                      )}

                      {/* Badges overlay */}
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        {service.is_featured && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-[var(--pw-yellow)] text-[#0D0B1E] flex items-center gap-1">
                            <Star className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                        {service.is_popular && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-orange-500 text-white flex items-center gap-1">
                            🔥 Popular
                          </span>
                        )}
                        {service.is_new && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-[var(--pw-purple)] text-white">
                            ✨ New
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        {getStatusBadge(service)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      {/* Category & meta row */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${catColor}`}>
                          <CatIcon className="w-2.5 h-2.5" />
                          {service.category}
                        </span>
                        {service.registration_close && (
                          <span className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(service.registration_close).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-extrabold text-[var(--text-primary)] text-base leading-snug mb-2 line-clamp-2">
                        {service.name}
                      </h3>

                      <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-4 line-clamp-2 flex-grow">
                        {service.description}
                      </p>

                      {/* Seats indicator */}
                      {seatsLeft !== null && !isClosed && (
                        <div className="mb-4">
                          <div className="flex justify-between text-[9px] font-semibold text-[var(--text-muted)] mb-1">
                            <span>Seats Remaining</span>
                            <span>{seatsLeft} / {service.max_seats}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--pw-purple)] transition-all"
                              style={{ width: `${Math.min(100, ((service.registered_count || 0) / service.max_seats) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                        <div>
                          {isFree ? (
                            <span className="font-display font-extrabold text-[var(--pw-green)] text-lg">Free</span>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-display font-extrabold text-[var(--pw-purple)] text-xl">
                                ₹{service.price}
                              </span>
                              {service.discount_price && service.discount_price < service.price && (
                                <span className="text-xs text-[var(--text-muted)] line-through">₹{service.discount_price}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => navigate(`/services/${service.id}`)}
                          disabled={isClosed}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-display text-xs font-bold uppercase tracking-wide transition-all ${
                            isClosed
                              ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed'
                              : 'bg-[var(--pw-purple)] hover:bg-[var(--pw-purple-dark)] text-white shadow-sm active:scale-95'
                          }`}
                        >
                          {isClosed ? 'Closed' : 'Register'}
                          {!isClosed && <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Stats Row */}
        {!isLoading && services.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap gap-6 items-center justify-center border-t border-[var(--border-subtle)] pt-8"
          >
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
              <BadgeCheck className="w-4 h-4 text-[var(--pw-purple)]" />
              <span><strong>{services.length}</strong> active services</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
              <Users className="w-4 h-4 text-[var(--pw-purple)]" />
              <span>
                <strong>{services.reduce((sum, s) => sum + (s.registered_count || 0), 0)}</strong> total registrations
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
              <Tag className="w-4 h-4 text-[var(--pw-purple)]" />
              <span>
                <strong>{services.filter(s => !s.price || s.price === 0).length}</strong> free services
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Services;
