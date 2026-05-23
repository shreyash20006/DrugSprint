import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { EventModal } from '../../components/admin/EventModal';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Edit, 
  Trash2, 
  CalendarDays, 
  Award, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  // Fetch stats for sidebar badge count
  const [pendingQuestions, setPendingQuestions] = useState(0);

  const fetchSidebarStats = async () => {
    try {
      const { data } = await supabase
        .from('questions')
        .select('status')
        .eq('status', 'pending');
      setPendingQuestions(data?.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching events:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSidebarStats();
  }, []);

  useEffect(() => {
    let result = [...events];

    // Search Query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'All') {
      result = result.filter((e) => e.type.toLowerCase() === typeFilter.toLowerCase());
    }

    setFilteredEvents(result);
  }, [events, searchQuery, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event/contest? This will erase it from the public records.')) {
      return;
    }

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      fetchEvents();
    } catch (err: any) {
      alert(`Error deleting event: ${err.message}`);
    }
  };

  const handleEdit = (eventItem: any) => {
    setEventToEdit(eventItem);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'competition':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'event':
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-light w-full">
      {/* Sidebar navigation */}
      <AdminSidebar activeTab="events" pendingQuestionsCount={pendingQuestions} />

      {/* Main View Container */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        
        {/* Page Header */}
        <header className="bg-white border-b border-navy-dark/5 px-8 py-5 flex items-center justify-between shrink-0 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-dark uppercase flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-orange-burnt" />
              <span>Events & Competitions Management</span>
            </h1>
            <p className="text-xs text-navy-dark/60 mt-0.5">
              Curate college timeline events, schedule contest forms, and highlight cash prizes.
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white rounded-lg font-display text-xs font-bold shadow-md shadow-orange-burnt/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </header>

        {/* Action Panels */}
        <div className="flex-grow overflow-y-auto p-8 space-y-6">
          
          {/* Filtering and Searching Overlay */}
          <div className="bg-white border border-navy-dark/5 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full md:flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-dark/30">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events/competitions by name keywords or description..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-gray-50/50 transition-colors"
              />
            </div>

            {/* Filters Row */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-navy-dark/40 shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full md:w-48 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-xs font-semibold uppercase tracking-wider text-navy-dark/80 bg-white"
              >
                <option value="All">All Types</option>
                <option value="Event">Timeline Event</option>
                <option value="Competition">Student Contest</option>
              </select>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white border border-navy-dark/5 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="h-72 flex flex-col items-center justify-center text-navy-dark/40">
                <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
                <p className="font-display text-sm tracking-wider uppercase">Loading database content...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-navy-dark text-white border-b border-navy-dark/10">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-24">Status</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Details</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-32">Type</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-44">Target Date</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-52">Prizes / Forms</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-white/50 w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-dark/5 bg-white">
                    {filteredEvents.map((e) => {
                      const formattedDate = e.deadline 
                        ? new Date(e.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No Target Set';

                      return (
                        <tr key={e.id} className="hover:bg-navy-dark/[0.01] transition-colors">
                          {/* Active / Inactive Status pill */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {e.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 bg-navy-dark/10 text-navy-dark/45 border border-navy-dark/15 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
                                Disabled
                              </span>
                            )}
                          </td>

                          {/* Name / Description Cell */}
                          <td className="px-6 py-4">
                            <div className="space-y-1 max-w-sm">
                              <span className="font-display font-bold text-sm text-navy-dark block leading-snug">
                                {e.name}
                              </span>
                              <p className="text-xs text-navy-dark/60 font-sans line-clamp-2 leading-relaxed">
                                {e.description}
                              </p>
                            </div>
                          </td>

                          {/* Event Type Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(e.type)}`}>
                              {e.type === 'competition' ? 'Contest' : 'Event'}
                            </span>
                          </td>

                          {/* Deadline Date Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/55">
                            <div className="flex items-center space-x-1.5">
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>

                          {/* Reward / Google Forms checks */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/70">
                            <div className="space-y-1">
                              {e.prize_info ? (
                                <div className="flex items-center space-x-1 text-[11px] font-semibold text-amber-600">
                                  <Award className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate max-w-[150px]">{e.prize_info}</span>
                                </div>
                              ) : null}
                              {e.google_form_link ? (
                                <a 
                                  href={e.google_form_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-orange-burnt hover:underline"
                                  title="Open Google Form"
                                >
                                  <span>Form Link</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : null}
                              {!e.prize_info && !e.google_form_link ? (
                                <span className="text-[10px] text-navy-dark/30 font-medium">None</span>
                              ) : null}
                            </div>
                          </td>

                          {/* Action Buttons overlay */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
                            <button
                              onClick={() => handleEdit(e)}
                              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white transition-colors"
                              title="Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(e.id)}
                              className="inline-flex items-center p-1.5 rounded-lg text-navy-dark/40 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 bg-white">
                <AlertCircle className="w-12 h-12 text-navy-dark/15 mx-auto mb-4" />
                <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wider">No Items Found</h3>
                <p className="text-xs text-navy-dark/50 max-w-sm mx-auto mt-1 leading-relaxed">
                  Start by launching your first college event or contest, or try clearing your keyword queries.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Event CRUD overlay modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchEvents}
        eventToEdit={eventToEdit}
      />
    </div>
  );
};

export default AdminEvents;
