import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/admin/Modal';
import { MediaPreviewBox } from '../../components/admin/MediaPreviewBox';
import { getCloudinaryThumbnail } from '../../lib/cloudinary';
import { useToast } from '../../components/admin/Toast';
import { logAction } from '../../lib/logger';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  AlertCircle,
  Tag,
  Video,
  Music,
  Play,
  Images,
  X
} from 'lucide-react';


export const AdminGallery: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Events' | 'Competitions' | 'Campus Life' | 'General'>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Bulk Add Modal
  type BulkRow = { title: string; media_url: string; category: string; media_type: 'image' | 'video' | 'audio' };
  const emptyRow = (): BulkRow => ({ title: '', media_url: '', category: 'Events', media_type: 'image' });
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyRow(), emptyRow()]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    media_url: '',
    media_urls: [''] as string[],
    category: 'Events',
    media_type: 'image' as 'image' | 'video' | 'audio',
  });

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err: any) {
      console.error('Error fetching gallery media:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (activeTab === 'All') {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter((p) => p.category.toLowerCase() === activeTab.toLowerCase()));
    }
  }, [photos, activeTab]);

  useEffect(() => {
    if (photoToEdit) {
      const urls = Array.isArray(photoToEdit.media_urls) && photoToEdit.media_urls.length > 0
        ? photoToEdit.media_urls
        : photoToEdit.media_url ? [photoToEdit.media_url] : [''];
      setFormData({
        title: photoToEdit.title || '',
        media_url: photoToEdit.media_url || '',
        media_urls: urls,
        category: photoToEdit.category || 'Events',
        media_type: photoToEdit.media_type || 'image',
      });
    } else {
      setFormData({
        title: '',
        media_url: '',
        media_urls: [''],
        category: 'Events',
        media_type: 'image',
      });
    }
  }, [photoToEdit, isModalOpen]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this media item from the gallery? Cannot undo.')) {
      return;
    }

    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (error) throw error;
      toast.success("✅ Media deleted successfully!");
      fetchPhotos();
    } catch (err: any) {
      toast.error(`❌ Action failed! ${err.message}`);
    }
  };

  const handleEdit = (photo: any) => {
    setPhotoToEdit(photo);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setPhotoToEdit(null);
    setIsModalOpen(true);
  };

  // Bulk row helpers
  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) => {
    setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const addBulkRow = () => setBulkRows(rows => [...rows, emptyRow()]);
  const removeBulkRow = (idx: number) => setBulkRows(rows => rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.title.trim() && r.media_url.trim().startsWith('https://'));
    if (validRows.length === 0) {
      toast.error('❌ At least one row needs a title and https:// URL.');
      return;
    }
    setIsBulkSaving(true);
    try {
      const payload = validRows.map(r => ({
        title: r.title.trim(),
        media_url: r.media_url.trim(),
        category: r.category,
        media_type: r.media_type,
      }));
      const { error } = await supabase.from('gallery').insert(payload);
      if (error) throw error;
      logAction('BULK_UPLOADED_MEDIA', `${payload.length} items`);
      toast.success(`✅ ${payload.length} media item(s) added successfully!`);
      fetchPhotos();
      setBulkRows([emptyRow(), emptyRow()]);
      setIsBulkOpen(false);
    } catch (err: any) {
      toast.error(`❌ Bulk save failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrls = formData.media_urls.map(u => u.trim()).filter(Boolean);

    if (formData.media_type !== 'image') {
      const trimmedUrl = formData.media_url.trim();
      if (!formData.title || !trimmedUrl) {
        toast.error('❌ Title and media URL are required.');
        return;
      }
      finalUrls = [trimmedUrl];
    } else {
      if (!formData.title || finalUrls.length === 0) {
        toast.error('❌ Title and at least one image URL are required.');
        return;
      }
    }

    // Protocol check
    for (const url of finalUrls) {
      if (!url.toLowerCase().startsWith('https://')) {
        toast.error('❌ All URLs must start with https://');
        return;
      }
    }

    // Format check only for video/audio
    if (formData.media_type === 'video') {
      const hasVideoExt = ['.mp4', '.mov', '.avi', '.webm'].some(ext => finalUrls[0].toLowerCase().includes(ext));
      if (!hasVideoExt) { toast.error('❌ Video URL must be .mp4, .mov, .avi or .webm'); return; }
    } else if (formData.media_type === 'audio') {
      const hasAudioExt = ['.mp3', '.wav', '.m4a', '.ogg'].some(ext => finalUrls[0].toLowerCase().includes(ext));
      if (!hasAudioExt) { toast.error('❌ Audio URL must be .mp3, .wav, .m4a or .ogg'); return; }
    }

    setIsSaving(true);
    try {
      // Auto optimize Cloudinary links on save
      const optimizedUrls = finalUrls.map((url) => {
        let optUrl = url;
        if (optUrl.includes('cloudinary.com')) {
          if (formData.media_type === 'image') {
            if (!optUrl.includes('/w_800,q_auto,f_auto/')) {
              optUrl = optUrl.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
            }
          } else if (formData.media_type === 'video') {
            if (!optUrl.includes('/w_800,q_auto,vc_auto/')) {
              optUrl = optUrl.replace('/upload/', '/upload/w_800,q_auto,vc_auto/');
            }
          }
        }
        return optUrl;
      });

      const dataPayload = {
        title: formData.title,
        media_url: optimizedUrls[0] || '',
        media_urls: optimizedUrls,
        category: formData.category,
        media_type: formData.media_type,
      };

      if (photoToEdit) {
        // UPDATE record
        const { error } = await supabase
          .from('gallery')
          .update(dataPayload)
          .eq('id', photoToEdit.id);

        if (error) throw error;
        toast.success("✅ Media updated successfully!");
      } else {
        // INSERT record
        const { error } = await supabase
          .from('gallery')
          .insert([dataPayload]);

        if (error) throw error;
        logAction('UPLOADED_MEDIA', formData.title);
        toast.success("✅ Media added successfully!");
      }

      fetchPhotos();
      // Reset form explicitly so user can immediately add another photo
      setFormData({ title: '', media_url: '', media_urls: [''], category: 'Events', media_type: 'image' });
      setPhotoToEdit(null);
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      toast.error(`❌ Save failed: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'competitions':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'campus life':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'general':
        return 'bg-white/10 text-white/60 border-white/20';
      case 'events':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  // Media Type Color Badges
  const getMediaTypeBadge = (type: 'image' | 'video' | 'audio') => {
    switch (type) {
      case 'video':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20 uppercase tracking-widest">
            <Video className="w-2.5 h-2.5 shrink-0" />
            <span>🎬 Video</span>
          </span>
        );
      case 'audio':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest">
            <Music className="w-2.5 h-2.5 shrink-0" />
            <span>🎵 Audio</span>
          </span>
        );
      case 'image':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-white/10 text-white/55 border-white/20 uppercase tracking-widest">
            <ImageIcon className="w-2.5 h-2.5 shrink-0" />
            <span>🖼️ Image</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <ImageIcon className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Multi-Media Console</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">
              Upload dynamic image, video, and audio links to build the student visual portfolio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setBulkRows([emptyRow(), emptyRow()]); setIsBulkOpen(true); }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.10] text-white rounded-xl font-display text-xs font-bold border border-white/10 transition-all"
          >
            <Images className="w-4 h-4" />
            <span>Bulk Add</span>
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl font-display text-xs font-bold shadow-md hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Media</span>
          </button>
        </div>
      </div>

      {/* Category Filter tabs */}
      <div className="flex flex-wrap bg-white/[0.04] backdrop-blur-sm border border-white/10 p-2.5 rounded-xl gap-2">
        {(['All', 'Events', 'Competitions', 'Campus Life', 'General'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-orange-burnt text-white shadow-sm'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Dynamic Cards Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-white/40 bg-white/[0.02] border border-white/5 rounded-2xl">
          <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
          <p className="font-display text-sm tracking-wider uppercase">Loading portfolio database...</p>
        </div>
      ) : filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => {
            const thumbnailSrc = getCloudinaryThumbnail(photo.media_url, photo.media_type);

            return (
              <div 
                key={photo.id} 
                className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Cover Image / Dynamic Icon box for Audio */}
                <div className="h-48 bg-black/30 overflow-hidden relative flex items-center justify-center">
                  {photo.media_type === 'audio' ? (
                    /* Audio waveform monogram placeholder */
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      <Music className="w-10 h-10" />
                    </div>
                  ) : (
                    /* Image / Video Poster covers */
                    <div className="w-full h-full relative">
                      {photo.media_type === 'video' ? (
                        <video
                          src={photo.media_url}
                          poster={thumbnailSrc.endsWith('.jpg') ? thumbnailSrc : undefined}
                          muted
                          playsInline
                          loop
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                          onMouseLeave={(e) => {
                            const v = e.target as HTMLVideoElement;
                            v.pause();
                            v.currentTime = 0;
                          }}
                          className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300"
                        />
                      ) : (
                        <img
                          src={thumbnailSrc}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      )}
                      
                      {/* Play overlay for video */}
                      {photo.media_type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-orange-burnt text-white flex items-center justify-center shadow-lg transform group-hover:scale-108 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Body details */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Category + Type Badges */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${getCategoryBadgeColor(photo.category)}`}>
                        <Tag className="w-2.5 h-2.5 shrink-0" />
                        <span>{photo.category}</span>
                      </span>
                      {getMediaTypeBadge(photo.media_type)}
                    </div>
                    
                    <h4 className="font-display font-extrabold text-sm text-white leading-snug">
                      {photo.title}
                    </h4>
                  </div>

                  {/* Actions overlay panel */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleEdit(photo)}
                      className="flex-grow inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-white/[0.05] text-white/70 hover:bg-orange-burnt hover:text-white text-xs font-semibold transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-1.5 rounded-xl text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-white/5"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl px-4">
          <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="font-display font-extrabold text-base text-white/60 uppercase tracking-wider">
            No Media Found
          </h3>
          <p className="text-xs text-white/30 max-w-xs mx-auto mt-1.5 leading-relaxed font-sans">
            Ready to publish your first media item? Click the add button to upload dynamic images, audios, or videos.
          </p>
        </div>
      )}

      {/* modal publisher drawer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={photoToEdit ? 'Edit Gallery Media' : 'Add Media to Gallery'}
        icon={<ImageIcon className="w-5 h-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Media Type horizontal Tab Selector (🖼 Image, 🎬 Video, 🎵 Audio) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Media Type *
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl w-full border border-white/10">
              {([
                { id: 'image' as const, label: '🖼️ Image' },
                { id: 'video' as const, label: '🎬 Video' },
                { id: 'audio' as const, label: '🎵 Audio' }
              ]).map((t) => {
                const isActive = formData.media_type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, media_type: t.id })}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-burnt text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Traditional Dance - Aura 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-sm bg-white/5 text-white placeholder-white/20 transition-colors"
            />
          </div>

          {/* Category drop down */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-sm bg-[#081120] text-white cursor-pointer"
            >
              <option className="bg-[#0D1B3E] text-white">Events</option>
              <option className="bg-[#0D1B3E] text-white">Competitions</option>
              <option className="bg-[#0D1B3E] text-white">Campus Life</option>
              <option className="bg-[#0D1B3E] text-white">General</option>
            </select>
          </div>

          {/* Upgraded Multi-Media inputs based on selected media type */}
          {formData.media_type === 'image' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Album Photos *
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, media_urls: [...formData.media_urls, ''] })}
                  className="text-xs font-bold text-orange-burnt hover:text-orange-burnt/85 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Photo</span>
                </button>
              </div>

              <div className="space-y-6 max-h-[35vh] overflow-y-auto pr-1">
                {formData.media_urls.map((url, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Photo {idx + 1}
                      </span>
                      {formData.media_urls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newUrls = formData.media_urls.filter((_, i) => i !== idx);
                            setFormData({
                              ...formData,
                              media_urls: newUrls,
                              media_url: idx === 0 ? (newUrls[0] || '') : formData.media_url
                            });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <MediaPreviewBox
                      mediaType="image"
                      value={url}
                      onChange={(val) => {
                        const newUrls = [...formData.media_urls];
                        newUrls[idx] = val;
                        setFormData({
                          ...formData,
                          media_urls: newUrls,
                          media_url: idx === 0 ? val : formData.media_url
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <MediaPreviewBox
              required
              mediaType={formData.media_type}
              value={formData.media_url}
              onChange={(val) => setFormData({ 
                ...formData, 
                media_url: val, 
                media_urls: [val] 
              })}
            />
          )}

          {/* Action buttons */}
          <div className="flex space-x-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-white/60 font-display text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 py-2.5 text-white font-display text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-1.5 ${
                isSaving 
                  ? 'bg-orange-burnt animate-pulse cursor-not-allowed shadow-[#C84B0E]/30'
                  : 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-[0_4px_12px_rgba(214,90,30,0.3)] hover:-translate-y-px active:scale-[0.99]'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Publish Media</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Bulk Add Modal ── */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Add Media"
        icon={<Images className="w-5 h-5" />}
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <p className="text-xs text-white/50 font-sans">
            Fill in as many rows as you like. Empty rows (no title or URL) are skipped automatically.
          </p>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {bulkRows.map((row, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-3 space-y-2 border border-white/10 relative">
                {/* Row number + remove button */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Item {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeBulkRow(idx)}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Title *"
                  value={row.title}
                  onChange={e => updateBulkRow(idx, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-xs bg-[#081120] text-white placeholder-white/20 transition-colors"
                />

                {/* URL */}
                <input
                  type="url"
                  placeholder="https:// media URL *"
                  value={row.media_url}
                  onChange={e => updateBulkRow(idx, 'media_url', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-xs bg-[#081120] text-white placeholder-white/20 transition-colors"
                />

                {/* Category + Type row */}
                <div className="flex gap-2">
                  <select
                    value={row.category}
                    onChange={e => updateBulkRow(idx, 'category', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-lg border border-white/10 focus:border-orange-burnt/50 outline-none text-xs bg-[#081120] text-white cursor-pointer"
                  >
                    <option className="bg-[#0D1B3E] text-white">Events</option>
                    <option className="bg-[#0D1B3E] text-white">Competitions</option>
                    <option className="bg-[#0D1B3E] text-white">Campus Life</option>
                    <option className="bg-[#0D1B3E] text-white">General</option>
                  </select>
                  <select
                    value={row.media_type}
                    onChange={e => updateBulkRow(idx, 'media_type', e.target.value as 'image' | 'video' | 'audio')}
                    className="flex-1 px-2 py-2 rounded-lg border border-white/10 focus:border-orange-burnt/50 outline-none text-xs bg-[#081120] text-white cursor-pointer"
                  >
                    <option value="image" className="bg-[#0D1B3E] text-white">🖼️ Image</option>
                    <option value="video" className="bg-[#0D1B3E] text-white">🎬 Video</option>
                    <option value="audio" className="bg-[#0D1B3E] text-white">🎵 Audio</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Add row button */}
          <button
            type="button"
            onClick={addBulkRow}
            className="w-full py-2 border-2 border-dashed border-white/20 hover:border-orange-burnt/45 hover:bg-white/5 text-white/50 hover:text-orange-burnt rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Row</span>
          </button>

          {/* Actions */}
          <div className="flex space-x-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-white/60 font-display text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBulkSaving}
              className={`flex-1 py-2.5 text-white font-display text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-1.5 ${
                isBulkSaving
                  ? 'bg-orange-burnt animate-pulse cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-[0_4px_12px_rgba(214,90,30,0.3)] hover:-translate-y-px active:scale-[0.99]'
              }`}
            >
              {isBulkSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
              ) : (
                <><Images className="w-4 h-4" /><span>Publish All</span></>
              )}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminGallery;
