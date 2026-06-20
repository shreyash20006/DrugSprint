import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Upload, Trash2, Plus, Loader2, Lock, X, AlertCircle, 
  MapPin, Phone, HelpCircle, CheckCircle, Tag, Clock, User 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  item_type: 'lost' | 'found';
  location: string;
  contact_info: string;
  image_url: string | null;
  status: 'active' | 'resolved';
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  created_at: string;
}

export const LostAndFound: React.FC = () => {
  const { studentProfile } = useStudentAuth();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found' | 'resolved'>('all');

  // Listings Data & Loading States
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isResolvingId, setIsResolvingId] = useState<string | null>(null);

  // Form / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'lost' | 'found'>('lost');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Items from Supabase
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lost_and_found')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching lost and found items:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter Listings
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesType = true;
      if (filterType === 'lost') {
        matchesType = item.item_type === 'lost' && item.status === 'active';
      } else if (filterType === 'found') {
        matchesType = item.item_type === 'found' && item.status === 'active';
      } else if (filterType === 'resolved') {
        matchesType = item.status === 'resolved';
      }

      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, filterType]);

  // Handle Photo select & validate
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setFormError('Only image files are supported.');
        setFormFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('File size exceeds the 10MB limit.');
        setFormFile(null);
        return;
      }
      setFormFile(file);
      setFormError('');
    }
  };

  // Submit Listing
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) {
      setFormError('You must be logged in to report an item.');
      return;
    }
    if (!formTitle.trim() || !formDescription.trim() || !formLocation.trim() || !formContact.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      let imageUrl = null;

      // 1. Upload image to Cloudinary if provided
      if (formFile) {
        imageUrl = await uploadFileToCloudinary(formFile);
      }

      // 2. Insert to Supabase
      const { error } = await supabase.from('lost_and_found').insert([
        {
          title: formTitle.trim(),
          description: formDescription.trim(),
          item_type: formType,
          location: formLocation.trim(),
          contact_info: formContact.trim(),
          image_url: imageUrl,
          status: 'active',
          reporter_id: studentProfile.id,
          reporter_name: studentProfile.full_name || 'Anonymous Student',
          reporter_email: studentProfile.email,
        }
      ]);

      if (error) throw error;

      // Reset Form & Close Modal
      setFormTitle('');
      setFormDescription('');
      setFormType('lost');
      setFormLocation('');
      setFormContact('');
      setFormFile(null);
      setIsModalOpen(false);

      // Refresh listings
      fetchItems();
    } catch (err: any) {
      console.error('Report submission failed:', err);
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Status to Resolved
  const handleResolveItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to mark this item as resolved?')) return;
    setIsResolvingId(id);
    try {
      const { error } = await supabase
        .from('lost_and_found')
        .update({ status: 'resolved' })
        .eq('id', id);

      if (error) throw error;
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item))
      );
    } catch (err: any) {
      console.error('Failed to resolve item:', err.message);
      alert('Error: ' + err.message);
    } finally {
      setIsResolvingId(null);
    }
  };

  // Delete Listing
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setIsDeletingId(id);
    try {
      const { error } = await supabase
        .from('lost_and_found')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Delete failed:', err.message);
      alert('Error: ' + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const isPrivilegedUser = (reporterId: string) => {
    if (!studentProfile) return false;
    if (studentProfile.id === reporterId) return true;
    return ['super_admin', 'admin', 'developer'].includes(studentProfile.role || '');
  };

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24 text-white">
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader
        icon={<HelpCircle className="w-6 h-6 text-orange-burnt animate-pulse" />}
        title="Campus Lost & Found Board"
        subtitle="A centralized bulletin board to report, find, and claim lost or found items on campus."
        breadcrumb="Lost & Found"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

        {/* Filter Categories bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {(['all', 'lost', 'found', 'resolved'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2.5 rounded-full font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                filterType === type
                  ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white border-transparent shadow-lg shadow-orange-burnt/15'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/65 hover:text-white border-white/[0.06]'
              }`}
            >
              {type === 'all' ? 'All Items' : type === 'lost' ? 'Lost Items' : type === 'found' ? 'Found Items' : 'Resolved'}
            </button>
          ))}
        </div>

        {/* Search & Actions Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-10 bg-[#0D1B3E]/85 p-4 rounded-2xl border border-orange-burnt/10 shadow-xl backdrop-blur-md">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-white/35" />
            <input
              type="text"
              placeholder="Search items, descriptions, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#060D1F] border border-orange-burnt/25 focus:border-orange-burnt rounded-xl py-3.5 pl-11 pr-4 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-orange-burnt/25"
            />
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => {
              if (!studentProfile) {
                alert('Please login to report a lost or found item.');
                return;
              }
              setIsModalOpen(true);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs sm:text-sm font-display font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-white/10"
          >
            <Plus className="w-5 h-5" />
            <span>Report Lost / Found</span>
          </button>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
            <p className="text-white/60 font-medium text-sm">Fetching bulletin board items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15 max-w-lg mx-auto p-6">
            <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-display font-bold text-white/70 text-lg">No listings found</h3>
            <p className="text-white/40 text-sm mt-1">
              {filterType === 'all'
                ? 'No items have been reported yet.'
                : `No items found matching the filter '${filterType}'.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, borderColor: 'rgba(214, 90, 30, 0.4)' }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-lg relative"
              >
                <div>
                  {/* Photo Container */}
                  <div className="h-56 bg-[#050B18] border-b border-orange-burnt/10 relative overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/20">
                        <HelpCircle className="w-16 h-16 mb-2" />
                        <span className="text-xs font-semibold uppercase tracking-wider">No Image Provided</span>
                      </div>
                    )}

                    {/* Status / Category Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {item.status === 'resolved' ? (
                        <span className="bg-gray-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      ) : item.item_type === 'lost' ? (
                        <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-md flex items-center gap-1">
                          ⚠️ Lost
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-md flex items-center gap-1">
                          🔍 Found
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata and details */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-white text-lg leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-white/60 text-xs mt-2 leading-relaxed font-sans line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-4 text-xs text-white/70">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-burnt shrink-0" />
                        <span className="font-semibold text-white/90">📍 Location:</span>
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-orange-burnt shrink-0" />
                        <span className="font-semibold text-white/90">📞 Contact:</span>
                        <span className="select-all">{item.contact_info}</span>
                      </div>
                    </div>

                    {/* Reporter info */}
                    <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-white/40 font-sans">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-white/30" />
                        Reported by: {item.reporter_name}
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-white/30" />
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Privileged actions */}
                {isPrivilegedUser(item.reporter_id) && (
                  <div className="p-6 pt-0 flex gap-2">
                    {item.status === 'active' && (
                      <button
                        disabled={isResolvingId === item.id}
                        onClick={() => handleResolveItem(item.id)}
                        className="flex-grow py-3 bg-[#060D1F] hover:bg-emerald-600 border border-emerald-500/35 hover:border-transparent text-emerald-400 hover:text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        {isResolvingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      disabled={isDeletingId === item.id}
                      onClick={() => handleDeleteItem(item.id)}
                      className="w-12 h-11 bg-red-500/10 hover:bg-red-500 border border-red-500/35 hover:border-transparent rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Delete Report"
                    >
                      {isDeletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#080F25] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D1B3E]/50">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-orange-burnt" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                    Report Lost or Found Item
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Item Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Black leather wallet, blue water bottle"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details like brand, color, contents inside, or unique identifier features."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20 resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category Type */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Report Type *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as 'lost' | 'found')}
                      className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors cursor-pointer"
                      disabled={isSubmitting}
                    >
                      <option value="lost">Lost Item</option>
                      <option value="found">Found Item</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Campus Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Canteen area, Sem II classroom"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Contact Details *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp 9876543210 or meet in Library"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Photo Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Attach Item Image (Optional)
                  </label>
                  <div className="border border-dashed border-white/15 hover:border-orange-burnt/50 transition-colors rounded-2xl bg-[#0F1E42]/30 p-5 flex flex-col items-center justify-center cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Upload className="w-6 h-6 text-white/30 group-hover:text-orange-burnt transition-colors mb-2" />
                    <span className="text-[10px] text-white/60 font-semibold text-center">
                      {formFile ? formFile.name : 'Select or drop an item snapshot'}
                    </span>
                    <span className="text-[8px] text-white/30 mt-1">Supported: JPG, PNG, WEBP (Max 10MB)</span>
                  </div>
                </div>

                {/* Security info */}
                <div className="bg-[#0D1B3E]/30 rounded-xl p-3 flex items-center space-x-2 text-[10px] text-white/40">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-orange-burnt/50" />
                  <span>
                    Reporting as: <strong className="text-white/70">{studentProfile?.full_name}</strong> ({studentProfile?.email})
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/80 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading Report...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Publish Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LostAndFound;
