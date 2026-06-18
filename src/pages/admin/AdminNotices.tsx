import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/admin/DataTable';
import { NoticeModal } from '../../components/admin/NoticeModal';
import { useToast } from '../../components/admin/Toast';
import { logAction } from '../../lib/logger';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit, 
  Pin, 
  Calendar, 
  FileText, 
  ExternalLink,
  AlertCircle 
} from 'lucide-react';

/* ========================================================
 * MOBILE CARD COMPONENT FOR NOTICES
 * ======================================================== */
const NoticeCardMobile: React.FC<{ 
  notice: any; 
  onEdit: (n: any) => void; 
  onDelete: (id: string) => void;
}> = ({ notice, onEdit, onDelete }) => {
  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'academic':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'event':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'alert':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'general':
      default:
        return 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20';
    }
  };

  const formattedDate = new Date(notice.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-5 space-y-3 hover:bg-white/[0.02] transition-colors relative">
      {/* Category + Pin strip */}
      <div className="flex items-center justify-between">
        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getCategoryBadgeColor(notice.category)}`}>
          {notice.category}
        </span>
        {notice.is_pinned && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
            <Pin className="w-2.5 h-2.5" />
            <span>Pinned</span>
          </span>
        )}
      </div>

      {/* Details info */}
      <div className="space-y-1">
        <h4 className="font-display font-extrabold text-sm text-white leading-snug">
          {notice.title}
        </h4>
        <p className="text-xs text-white/55 font-sans leading-relaxed">
          {notice.description}
        </p>
      </div>

      {/* Date & Attachments */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1 text-[10px] text-white/35 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        {/* Action icons for attachments */}
        <div className="flex items-center space-x-2">
          {notice.pdf_url && (
            <a 
              href={notice.pdf_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1 rounded bg-white/[0.05] text-white/50 hover:bg-orange-burnt hover:text-white transition-colors"
              title="PDF Attachment"
            >
              <FileText className="w-3.5 h-3.5" />
            </a>
          )}
          {notice.external_link && (
            <a 
              href={notice.external_link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1 rounded bg-white/[0.05] text-white/50 hover:bg-orange-burnt hover:text-white transition-colors"
              title="External Link Attachment"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Card CRUD action controls */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => onEdit(notice)}
          className="flex-grow inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-white/[0.05] text-white/70 hover:bg-orange-burnt hover:text-white text-xs font-semibold transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Notice</span>
        </button>
        <button
          onClick={() => onDelete(notice.id)}
          className="p-1.5 rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-white/5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const AdminNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<any>(null);

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
  }, []);

  useEffect(() => {
    let result = [...notices];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'All') {
      result = result.filter((n) => n.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    setFilteredNotices(result);
  }, [notices, searchQuery, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notice? Cannot undo.')) return;
    const notice = notices.find((n) => n.id === id);

    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
      logAction('DELETED_NOTICE', notice?.title || 'Unknown Notice');
      toast.success("✅ Notice deleted successfully!");
      fetchNotices();
    } catch (err: any) {
      toast.error(`❌ Failed to delete notice. ${err.message}`);
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'event':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'alert':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'general':
      default:
        return 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20';
    }
  };

  const headers = [
    { key: 'status', label: 'Status', className: 'w-24' },
    { key: 'title', label: 'Notice Details' },
    { key: 'category', label: 'Category', className: 'w-36' },
    { key: 'created_at', label: 'Date Published', className: 'w-44' },
    { key: 'attachments', label: 'Attachments', className: 'w-36' },
    { key: 'actions', label: 'Actions', className: 'text-right w-44' }
  ];

  const categoryOptions = [
    { value: 'All', label: 'All Categories' },
    { value: 'Academic', label: 'Academic 📘' },
    { value: 'Event', label: 'Events 🎖️' },
    { value: 'Alert', label: 'Alerts 🚨' },
    { value: 'General', label: 'General 📣' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Notices Header trigger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <Megaphone className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Announcements Feed</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">Create, pin, and update notices broadcasted live on the board.</p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl font-display text-xs font-bold shadow-md hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Notice</span>
        </button>
      </div>

      {/* Notices DataTable list */}
      <DataTable
        headers={headers}
        data={filteredNotices}
        isLoading={isLoading}
        emptyState={{
          icon: <AlertCircle className="w-12 h-12 text-white/10" />,
          title: 'No Notices Found',
          description: 'Ready to launch your first campus announcement? Click the add button to publish updates.'
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search notices by title keywords or category updates..."
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterOptions={categoryOptions}
        renderRowDesktop={(item) => {
          const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
              {/* Pinned Icon cell */}
              <td className="px-6 py-4 whitespace-nowrap">
                {item.is_pinned ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
                    <Pin className="w-2.5 h-2.5" />
                    <span>Pinned</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/20 pl-2">—</span>
                )}
              </td>

              {/* Title / Description Cell */}
              <td className="px-6 py-4">
                <div className="space-y-1 max-w-md">
                  <span className="font-display font-bold text-sm text-white block leading-snug">
                    {item.title}
                  </span>
                  <p className="text-xs text-white/50 font-sans line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </td>

              {/* Category Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getCategoryBadgeColor(item.category)}`}>
                  {item.category}
                </span>
              </td>

              {/* Date Bubble */}
              <td className="px-6 py-4 whitespace-nowrap text-xs text-white/40">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </td>

              {/* Links / Resources attachment checks */}
              <td className="px-6 py-4 whitespace-nowrap text-xs text-white/50">
                <div className="flex space-x-3">
                  {item.pdf_url && (
                    <a 
                      href={item.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-1 rounded bg-white/[0.05] text-white/50 hover:bg-orange-burnt hover:text-white transition-colors block"
                      title="PDF Document"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {item.external_link && (
                    <a 
                      href={item.external_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-1 rounded bg-white/[0.05] text-white/50 hover:bg-orange-burnt hover:text-white transition-colors block"
                      title="External Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {!item.pdf_url && !item.external_link && (
                    <span className="text-[10px] text-white/20 font-medium">None</span>
                  )}
                </div>
              </td>

              {/* Actions columns */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-white/[0.05] text-white/70 hover:bg-orange-burnt hover:text-white transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="inline-flex items-center p-1.5 rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          );
        }}
        renderCardMobile={(item) => (
          <NoticeCardMobile
            key={item.id}
            notice={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      />

      {/* Modal publisher */}
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
