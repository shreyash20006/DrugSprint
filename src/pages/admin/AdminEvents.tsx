import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/admin/DataTable';
import { EventModal } from '../../components/admin/EventModal';
import { useToast } from '../../components/admin/Toast';
import QRCode from 'react-qr-code';
import { 
  Plus, 
  Trash2, 
  Edit, 
  CalendarDays, 
  Award, 
  ExternalLink,
  AlertCircle,
  QrCode,
  Copy,
  Check
} from 'lucide-react';

/* ========================================================
 * MOBILE CARD COMPONENT FOR EVENTS
 * ======================================================== */
const EventCardMobile: React.FC<{ 
  eventItem: any; 
  onEdit: (e: any) => void; 
  onDelete: (id: string) => void;
  onSharePayment: (e: any) => void;
}> = ({ eventItem, onEdit, onDelete, onSharePayment }) => {
  const getTypeBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'competition':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'event':
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  const formattedDate = eventItem.deadline 
    ? new Date(eventItem.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No Date Target';

  return (
    <div className="p-5 space-y-3 hover:bg-navy-dark/[0.01] transition-colors relative">
      {/* Category type + Active status strip */}
      <div className="flex items-center justify-between">
        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(eventItem.type)}`}>
          {eventItem.type === 'competition' ? 'Contest' : 'Event'}
        </span>
        {eventItem.is_active ? (
          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 bg-navy-dark/10 text-navy-dark/45 border border-navy-dark/15 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
            Disabled
          </span>
        )}
      </div>

      {/* Title Details */}
      <div className="space-y-1">
        <h4 className="font-display font-extrabold text-sm text-navy-dark leading-snug">
          {eventItem.name}
        </h4>
        <p className="text-xs text-navy-dark/60 font-sans leading-relaxed">
          {eventItem.description}
        </p>
      </div>

      {/* Date & Extras */}
      <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-navy-dark/70">
        <div className="flex items-center space-x-1.5 text-[10px] text-navy-dark/45 font-medium">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        {/* Prizes & forms link */}
        <div className="flex flex-col items-end space-y-1">
          {eventItem.prize_info && (
            <div className="flex items-center space-x-0.5 text-[10px] text-amber-600 font-bold">
              <Award className="w-3 h-3" />
              <span>{eventItem.prize_info}</span>
            </div>
          )}
          {eventItem.google_form_link && (
            <a 
              href={eventItem.google_form_link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center space-x-0.5 text-[9px] text-orange-burnt hover:underline font-extrabold uppercase tracking-wide"
            >
              <span>Forms</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Card CRUD controls */}
      <div className="flex items-center gap-2 pt-2 border-t border-navy-dark/5 flex-wrap">
        <button
          onClick={() => onSharePayment(eventItem)}
          className="inline-flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-lg bg-orange-burnt/5 text-orange-burnt hover:bg-orange-burnt hover:text-white text-xs font-semibold transition-colors flex-grow"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Share QR</span>
        </button>
        <button
          onClick={() => onEdit(eventItem)}
          className="inline-flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white text-xs font-semibold transition-colors flex-grow"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => onDelete(eventItem.id)}
          className="p-1.5 rounded-lg text-navy-dark/45 hover:bg-red-50 hover:text-red-600 transition-colors border border-navy-dark/5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeTab, setTypeTab] = useState<'All' | 'event' | 'competition'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  // Share Payment State
  const [sharePaymentEvent, setSharePaymentEvent] = useState<any | null>(null);
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(50);
  const [copied, setCopied] = useState(false);

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
  }, []);

  useEffect(() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    if (typeTab !== 'All') {
      result = result.filter((e) => e.type.toLowerCase() === typeTab.toLowerCase());
    }

    setFilteredEvents(result);
  }, [events, searchQuery, typeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event/contest? Cannot undo.')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success("✅ Event deleted successfully!");
      fetchEvents();
    } catch (err: any) {
      toast.error(`❌ Failed to delete event. ${err.message}`);
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

  const headers = [
    { key: 'status', label: 'Status', className: 'w-24' },
    { key: 'name', label: 'Details' },
    { key: 'type', label: 'Type', className: 'w-32' },
    { key: 'deadline', label: 'Target Date', className: 'w-44' },
    { key: 'extras', label: 'Prizes & Forms', className: 'w-52' },
    { key: 'actions', label: 'Actions', className: 'text-right w-44' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Dynamic Tab Filter Bar & Add Buttons */}
      <div className="bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Visual filter tabs as requested */}
        <div className="flex bg-gray-light p-1 rounded-xl w-full sm:w-auto">
          {(['All', 'event', 'competition'] as const).map((tab) => {
            const label = tab === 'All' ? 'All Operations' : tab === 'event' ? 'Timeline Events' : 'Competitions';
            const isActive = typeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setTypeTab(tab)}
                className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-burnt text-white shadow-sm'
                    : 'text-navy-dark/60 hover:text-navy-dark'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleAddNew}
          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4.5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white rounded-lg font-display text-xs font-bold shadow-md shadow-orange-burnt/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Event</span>
        </button>
      </div>

      {/* Events DataTable list */}
      <DataTable
        headers={headers}
        data={filteredEvents}
        isLoading={isLoading}
        emptyState={{
          icon: <AlertCircle className="w-12 h-12 text-navy-dark/15" />,
          title: 'No Events Found',
          description: 'Ready to launch your first event or student contest card? Click the add button to publish now.'
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search events/competitions by title keywords or summaries..."
        renderRowDesktop={(item) => {
          const formattedDate = item.deadline 
            ? new Date(item.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'No Target Set';

          return (
            <tr key={item.id} className="hover:bg-navy-dark/[0.01] transition-colors">
              {/* Active Badge cell */}
              <td className="px-6 py-4 whitespace-nowrap">
                {item.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 bg-navy-dark/10 text-navy-dark/45 border border-navy-dark/15 text-[9px] font-extrabold tracking-wider uppercase rounded-full">
                    Disabled
                  </span>
                )}
              </td>

              {/* Name Details */}
              <td className="px-6 py-4">
                <div className="space-y-1 max-w-xs">
                  <span className="font-display font-bold text-sm text-navy-dark block leading-snug">
                    {item.name}
                  </span>
                  <p className="text-xs text-navy-dark/60 font-sans line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </td>

              {/* Type Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(item.type)}`}>
                  {item.type === 'competition' ? 'Contest' : 'Event'}
                </span>
              </td>

              {/* Target Date */}
              <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/55">
                <div className="flex items-center space-x-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </td>

              {/* Prizes and Forms Link */}
              <td className="px-6 py-4 whitespace-nowrap text-xs text-navy-dark/70">
                <div className="space-y-1 max-w-[180px] truncate">
                  {item.prize_info && (
                    <div className="flex items-center space-x-1 text-[11px] font-bold text-amber-600 leading-none">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.prize_info}</span>
                    </div>
                  )}
                  {item.google_form_link && (
                    <a 
                      href={item.google_form_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-orange-burnt hover:underline"
                    >
                      <span>Form Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {!item.prize_info && !item.google_form_link && (
                    <span className="text-[10px] text-navy-dark/30 font-medium">None</span>
                  )}
                </div>
              </td>

              {/* Action column */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
                <button
                  onClick={() => {
                    setSharePaymentEvent(item);
                    setPaymentPurpose(item.name);
                    setPaymentAmount(50);
                  }}
                  className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-orange-burnt/5 text-orange-burnt hover:bg-orange-burnt hover:text-white transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Share QR</span>
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="inline-flex items-center p-1.5 rounded-lg text-navy-dark/40 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          );
        }}
        renderCardMobile={(item) => (
          <EventCardMobile
            key={item.id}
            eventItem={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSharePayment={(ev) => {
              setSharePaymentEvent(ev);
              setPaymentPurpose(ev.name);
              setPaymentAmount(50);
            }}
          />
        )}
      />

      {/* Modal publisher */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchEvents}
        eventToEdit={eventToEdit}
      />

      {/* Shareable QR Code Link Modal */}
      {sharePaymentEvent && (() => {
        const generatedUrl = `${window.location.origin}/pay?purpose=${encodeURIComponent(paymentPurpose)}&amount=${paymentAmount}`;
        
        const handleCopyLink = () => {
          navigator.clipboard.writeText(generatedUrl);
          setCopied(true);
          toast.success('📋 Payment link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <div 
              onClick={() => setSharePaymentEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Modal Box */}
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 sm:p-8 relative border border-navy-dark/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-navy-dark">
              <h3 className="font-display font-extrabold text-lg text-navy-dark border-b border-navy-dark/10 pb-3 mb-5 uppercase tracking-wide flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-orange-burnt" />
                <span>Generate Payment Link</span>
              </h3>

              <div className="space-y-4">
                {/* Event Name */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-1">Source Event</span>
                  <span className="font-semibold text-navy-dark block leading-snug">{sharePaymentEvent.name}</span>
                </div>

                {/* Purpose Field */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-1.5">Payment Purpose*</label>
                  <input
                    type="text"
                    value={paymentPurpose}
                    onChange={(e) => setPaymentPurpose(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans"
                    required
                  />
                </div>

                {/* Amount Field */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-1.5">Ticket Amount (INR)*</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans"
                    required
                    min="0"
                  />
                </div>

                <hr className="border-navy-dark/10 my-4" />

                {/* QR Code display */}
                <div className="flex flex-col items-center justify-center space-y-3 bg-gray-50 p-4 rounded-xl border border-navy-dark/5">
                  <div className="p-2.5 bg-white rounded-lg border border-navy-dark/10 shadow-sm flex items-center justify-center">
                    <QRCode value={generatedUrl} size={150} />
                  </div>
                  <span className="text-[10px] text-navy-dark/40 font-semibold uppercase tracking-wider">
                    Scan with WhatsApp or UPI camera
                  </span>
                </div>

                {/* Share Link Box */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border border-navy-dark/10 bg-gray-50 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-lg bg-navy-dark hover:bg-orange-burnt text-white font-display text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSharePaymentEvent(null)}
                className="mt-6 w-full py-2.5 rounded-xl border border-navy-dark/15 hover:bg-navy-dark hover:text-white text-navy-dark font-display text-xs font-bold transition-all uppercase tracking-widest cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default AdminEvents;
