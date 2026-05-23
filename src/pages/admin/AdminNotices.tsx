import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { NoticeModal } from '../../components/admin/NoticeModal';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Edit, 
  Trash2, 
  Pin, 
  Calendar, 
  FileText, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export const AdminNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<any>(null);

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

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (err: any) {
      console.error('Error fetching notices:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchSidebarStats();
  }, []);

  useEffect(() => {
    let result = [...notices];

    // Search Query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((n) => n.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    setFilteredNotices(result);
  }, [notices, searchQuery, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This will remove it from the student notices board permanently.')) {
      return;
    }

    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
      fetchNotices();
    } catch (err: any) {
      alert(`Error deleting notice: ${err.message}`);
    }
  };

  const handleEdit = (notice: any) => {
    setNoticeToEdit(notice);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setNoticeToEdit(null);
    setIsModalOpen(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'academic':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'event':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'alert':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'general':
      default:
        return 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-light w-full">
      {/* Sidebar navigation */}
      <AdminSidebar activeTab="notices" pendingQuestionsCount={pendingQuestions} />

      {/* Main View Container */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        
        {/* Page Header */}
        <header className="bg-white border-b border-navy-dark/5 px-8 py-5 flex items-center justify-between shrink-0 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-dark uppercase flex items-center space-x-2">
              <Megaphone className="w-6 h-6 text-orange-burnt" />
              <span>Notices Board Management</span>
            </h1>
            <p className="text-xs text-navy-dark/60 mt-0.5">
              Publish news, pin emergency alerts, and attach document resources.
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white rounded-lg font-display text-xs font-bold shadow-md shadow-orange-burnt/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Notice</span>
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
                placeholder="Search notices by title keywords or description text..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-gray-50/50 transition-colors"
              />
            </div>

            {/* Filters Row */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-navy-dark/40 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full md:w-48 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-xs font-semibold uppercase tracking-wider text-navy-dark/80 bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Academic">Academic</option>
                <option value="Event">Events</option>
                <option value="Alert">Alerts</option>
                <option value="General">General</option>
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
            ) : filteredNotices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-navy-dark text-white border-b border-navy-dark/10">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-24">Status</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Notice Details</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-36">Category</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-44">Date Published</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/50 w-36">Attachments</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-white/50 w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-dark/5 bg-white">
                    {filteredNotices.map((n) => {
                      const formattedDate = new Date(n.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr key={n.id} className="hover:bg-navy-dark/[0.01] transition-colors">
                          {/* Pinned Icon cell */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {n.is_pinned ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
                                <Pin className="w-3 h-3 animate-bounce" />
                                <span>Pinned</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-navy-dark/30 pl-2">—</span>
                            )}
                          </td>

                          {/* Title / Description Cell */}
                          <td className="px-6 py-4">
                            <div className="space-y-1 max-w-md">
                              <span className="font-display font-bold text-sm text-navy-dark block leading-snug">
                                {n.title}
                              </span>
                              <p className="text-xs text-navy-dark/60 font-sans line-clamp-2 leading-relaxed">
                                {n.description}
                              </p>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getCategoryBadgeColor(n.category)}`}>
                              {n.category}
                            </span>
                          </td>

                          {/* Date Bubble */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/55">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>

                          {/* Links / Resources attachment checks */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/70">
                            <div className="flex space-x-3">
                              {n.pdf_url ? (
                                <a 
                                  href={n.pdf_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="p-1 rounded bg-navy-dark/5 hover:bg-orange-burnt hover:text-white transition-colors block"
                                  title="PDF Document Attached"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </a>
                              ) : null}
                              {n.external_link ? (
                                <a 
                                  href={n.external_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="p-1 rounded bg-navy-dark/5 hover:bg-orange-burnt hover:text-white transition-colors block"
                                  title="External URL Attached"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : null}
                              {!n.pdf_url && !n.external_link ? (
                                <span className="text-[10px] text-navy-dark/30 font-medium">None</span>
                              ) : null}
                            </div>
                          </td>

                          {/* Action overlay buttons */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
                            <button
                              onClick={() => handleEdit(n)}
                              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white transition-colors"
                              title="Edit Announcement"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(n.id)}
                              className="inline-flex items-center p-1.5 rounded-lg text-navy-dark/40 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete Announcement"
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
                <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wider">No Announcements Found</h3>
                <p className="text-xs text-navy-dark/50 max-w-sm mx-auto mt-1 leading-relaxed">
                  Start by launching your first announcement, or try clearing your keyword queries and selecting all categories.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Notice CRUD overlay modal */}
      <NoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchNotices}
        noticeToEdit={noticeToEdit}
      />
    </div>
  );
};

export default AdminNotices;
