import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Upload, Trash2, Plus, Loader2, Lock, X, AlertCircle, 
  MapPin, Phone, HelpCircle, CheckCircle, Clock, User 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { uploadFileToCloudinary } from '../../lib/cloudinary';

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

  // Details Modal (Bottom Drawer)
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

  // List Data & Loaders
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isResolvingId, setIsResolvingId] = useState<string | null>(null);

  // Form Sheet State (Report Item)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'lost' | 'found'>('lost');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch from Supabase
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
      console.error('Mobile fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filters listings
  const filteredItems = useMemo(() => {
    return items.filter(item => {
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

  // File validator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setFormError('Only images are supported.');
        setFormFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Size exceeds 10MB limit.');
        setFormFile(null);
        return;
      }
      setFormFile(file);
      setFormError('');
    }
  };

  // Submit report
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) {
      setFormError('Please sign in first.');
      return;
    }
    if (!formTitle.trim() || !formDescription.trim() || !formLocation.trim() || !formContact.trim()) {
      setFormError('Fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      let imageUrl = null;
      if (formFile) {
        imageUrl = await uploadFileToCloudinary(formFile);
      }

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

      setFormTitle('');
      setFormDescription('');
      setFormType('lost');
      setFormLocation('');
      setFormContact('');
      setFormFile(null);
      setIsDrawerOpen(false);

      fetchItems();
    } catch (err: any) {
      console.error('Mobile submit failed:', err);
      setFormError(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve
  const handleResolveItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Resolve this listing?')) return;
    setIsResolvingId(id);
    try {
      const { error } = await supabase
        .from('lost_and_found')
        .update({ status: 'resolved' })
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'resolved' } : item));
      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, status: 'resolved' } : null);
      }
    } catch (err: any) {
      console.error('Resolve error:', err.message);
      alert('Failed: ' + err.message);
    } finally {
      setIsResolvingId(null);
    }
  };

  // Delete
  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this listing?')) return;
    setIsDeletingId(id);
    try {
      const { error } = await supabase
        .from('lost_and_found')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItem(null);
    } catch (err: any) {
      console.error('Delete error:', err.message);
      alert('Failed: ' + err.message);
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
    <div className="space-y-6 pb-6 pt-4 text-white">
      {/* Welcome Hero */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Campus Life
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight">
          Lost & Found Board
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          Bulletin board to check, claim, or report items lost or found on campus.
        </p>
      </section>

      {/* Tabs / Filters bar */}
      <div className="bg-[#0F1E42]/85 border border-white/5 p-1 rounded-xl flex shadow-md overflow-x-auto gap-1">
        {(['all', 'lost', 'found', 'resolved'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-grow text-center py-2.5 px-3 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              filterType === type ? 'bg-orange-burnt text-white' : 'text-white/45'
            }`}
          >
            {type === 'all' ? 'All' : type === 'lost' ? 'Lost' : type === 'found' ? 'Found' : 'Resolved'}
          </button>
        ))}
      </div>

      {/* Search & Report Button */}
      <div className="space-y-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search items, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/25"
          />
        </div>

        <button
          onClick={() => {
            if (!studentProfile) {
              alert('Please sign in to report an item.');
              return;
            }
            setIsDrawerOpen(true);
          }}
          className="w-full py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl shadow-lg border border-white/10 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Report Lost / Found</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-2" />
            <p className="text-xs text-white/50">Loading bulletin board...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center p-6">
            <HelpCircle className="w-9 h-9 text-white/10 mb-3" />
            <h3 className="font-display font-bold text-white/60 text-xs">No Items Found</h3>
            <p className="text-white/40 text-[11px] mt-1">Refine your search or categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-[#0F1E42]/80 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.98] shadow-md cursor-pointer relative"
              >
                {/* Photo Thumbnail */}
                <div className="relative w-full h-28 bg-[#0D1B3E] flex items-center justify-center">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HelpCircle className="w-8 h-8 text-white/20" />
                  )}

                  {/* Status Tag */}
                  <div className="absolute top-2 left-2">
                    {item.status === 'resolved' ? (
                      <span className="bg-gray-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Resolved
                      </span>
                    ) : item.item_type === 'lost' ? (
                      <span className="bg-red-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Lost
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Found
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 space-y-2 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-extrabold text-[11px] text-white line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[9px] text-white/50 font-sans line-clamp-2 mt-1 leading-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-2 mt-1 space-y-1 text-[9px] text-white/60">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5 text-orange-burnt shrink-0" />
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Bottom Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 bg-black/75 backdrop-blur-sm">
            <div onClick={() => setSelectedItem(null)} className="absolute inset-0" />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-[#080F25] rounded-t-3xl border-t border-white/10 p-6 flex flex-col overflow-y-auto z-10 text-white"
            >
              <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex gap-2 items-center mb-1.5">
                    {selectedItem.status === 'resolved' ? (
                      <span className="bg-gray-500 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                        Resolved
                      </span>
                    ) : selectedItem.item_type === 'lost' ? (
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                        Lost
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                        Found
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-extrabold text-sm text-white max-w-[280px] leading-snug">
                    {selectedItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-xl bg-white/5 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo & Quick specs */}
              <div className="flex gap-4 mb-4">
                <div className="w-28 h-32 rounded-xl bg-[#0D1B3E] overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                  {selectedItem.image_url ? (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HelpCircle className="w-10 h-10 text-white/20" />
                  )}
                </div>
                <div className="space-y-2 text-xs text-white/70">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                    <div>
                      <span className="block text-[8px] text-white/40 uppercase">Location</span>
                      <span className="font-bold text-white">{selectedItem.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <Phone className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                    <div>
                      <span className="block text-[8px] text-white/40 uppercase">Contact Details</span>
                      <span className="font-bold text-white select-all">{selectedItem.contact_info}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <User className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                    <div>
                      <span className="block text-[8px] text-white/40 uppercase">Reported By</span>
                      <span className="font-bold text-white">{selectedItem.reporter_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-white/5 pt-4 my-2 text-xs text-white/60 leading-relaxed font-sans">
                <span className="block text-[10px] font-bold text-orange-burnt uppercase tracking-wider mb-1">
                  Item Description
                </span>
                <p>{selectedItem.description}</p>
              </div>

              {/* Date */}
              <div className="text-[10px] text-white/35 font-sans pt-2 border-t border-white/5 mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/20" />
                <span>Reported Date: {new Date(selectedItem.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              {isPrivilegedUser(selectedItem.reporter_id) && (
                <div className="flex gap-3 pt-6">
                  {selectedItem.status === 'active' && (
                    <button
                      disabled={isResolvingId === selectedItem.id}
                      onClick={(e) => handleResolveItem(e, selectedItem.id)}
                      className="flex-grow py-3.5 bg-gradient-to-r from-emerald-600 to-[#2ECC71] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
                    >
                      {isResolvingId === selectedItem.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Resolved</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    disabled={isDeletingId === selectedItem.id}
                    onClick={(e) => handleDeleteItem(e, selectedItem.id)}
                    className="w-14 py-3.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-[0.98]"
                  >
                    {isDeletingId === selectedItem.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Form Sheet */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 bg-black/80 backdrop-blur-sm">
            <div onClick={() => !isSubmitting && setIsDrawerOpen(false)} className="absolute inset-0" />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[90vh] bg-[#080F25] rounded-t-3xl border-t border-white/10 p-6 flex flex-col overflow-y-auto z-10 text-white"
            >
              <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                  Report Bulletin Item
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-xl bg-white/5 text-white/60 hover:text-white"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lost keys, Found lab coat"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt"
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
                    placeholder="Describe specific features (brand, color, marks)..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Type and Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Report Type *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as 'lost' | 'found')}
                      className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      disabled={isSubmitting}
                    >
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Canteen area"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Contact info */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Contact Information *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp 9988776655"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Photo Picker */}
                <div className="border border-dashed border-white/15 rounded-2xl bg-[#0F1E42]/30 p-5 flex flex-col items-center justify-center relative cursor-pointer min-h-[90px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <Upload className="w-7 h-7 text-white/30 mb-1" />
                  <span className="text-[10px] text-white/60 text-center px-2">
                    {formFile ? formFile.name : 'Tap to select photo (Optional)'}
                  </span>
                  <span className="text-[8px] text-white/30 mt-1">JPG, PNG, WEBP (Max 10MB)</span>
                </div>

                {/* Security Badge */}
                <div className="bg-[#0D1B3E]/30 rounded-xl p-3 flex items-center space-x-2 text-[10px] text-white/40">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-orange-burnt/50" />
                  <span>
                    Reporting as: <strong className="text-white/70">{studentProfile?.full_name}</strong>
                  </span>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-display font-bold uppercase tracking-wider"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Report</span>
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
