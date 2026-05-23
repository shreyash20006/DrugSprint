import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/admin/Modal';
import { MediaPreviewBox } from '../../components/admin/MediaPreviewBox';
import { getCloudinaryThumbnail } from '../../lib/cloudinary';
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
  Play
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

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    media_url: '',
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
      setFormData({
        title: photoToEdit.title || '',
        media_url: photoToEdit.media_url || '',
        category: photoToEdit.category || 'Events',
        media_type: photoToEdit.media_type || 'image',
      });
    } else {
      setFormData({
        title: '',
        media_url: '',
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
      fetchPhotos();
    } catch (err: any) {
      alert(`Error deleting media: ${err.message}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.media_url) return;

    setIsSaving(true);
    try {
      const dataPayload = {
        title: formData.title,
        media_url: formData.media_url,
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
      } else {
        // INSERT record
        const { error } = await supabase
          .from('gallery')
          .insert([dataPayload]);

        if (error) throw error;
      }

      fetchPhotos();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving media item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'competitions':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'campus life':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'general':
        return 'bg-navy-dark/10 text-navy-dark border-navy-dark/20';
      case 'events':
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-blue-500/10 text-blue-600 border-blue-500/20 uppercase tracking-widest">
            <Music className="w-2.5 h-2.5 shrink-0" />
            <span>🎵 Audio</span>
          </span>
        );
      case 'image':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-gray-100 text-gray-600 border-gray-200 uppercase tracking-widest">
            <ImageIcon className="w-2.5 h-2.5 shrink-0" />
            <span>🖼️ Image</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-navy-dark">Multi-Media Console</h3>
            <p className="text-[10px] text-navy-dark/45 font-sans leading-none mt-0.5">
              Upload dynamic image, video, and audio links to build the student visual portfolio.
            </p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white rounded-lg font-display text-xs font-bold shadow-md shadow-orange-burnt/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Media</span>
        </button>
      </div>

      {/* Category Filter tabs */}
      <div className="flex flex-wrap bg-white border border-navy-dark/10 p-2.5 rounded-xl gap-2 shadow-xs">
        {(['All', 'Events', 'Competitions', 'Campus Life', 'General'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-navy-dark text-white shadow-sm'
                  : 'text-navy-dark/65 hover:bg-gray-light hover:text-navy-dark'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Dynamic Cards Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-navy-dark/45 bg-white border border-navy-dark/10 rounded-2xl">
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
                className="bg-white border border-navy-dark/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                {/* Cover Image / Dynamic Icon box for Audio */}
                <div className="h-48 bg-navy-dark/5 overflow-hidden relative flex items-center justify-center">
                  {photo.media_type === 'audio' ? (
                    /* Audio waveform monogram placeholder */
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      <Music className="w-10 h-10" />
                    </div>
                  ) : (
                    /* Image / Video Poster covers */
                    <div className="w-full h-full relative">
                      <img
                        src={thumbnailSrc}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      
                      {/* Play overlay for video */}
                      {photo.media_type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
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
                    
                    <h4 className="font-display font-extrabold text-sm text-navy-dark leading-snug">
                      {photo.title}
                    </h4>
                  </div>

                  {/* Actions overlay panel */}
                  <div className="flex items-center gap-2 pt-2 border-t border-navy-dark/5">
                    <button
                      onClick={() => handleEdit(photo)}
                      className="flex-grow inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-navy-dark/5 text-navy-dark hover:bg-navy-dark hover:text-white text-xs font-semibold transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-1.5 rounded-lg text-navy-dark/45 hover:bg-red-50 hover:text-red-600 transition-colors border border-navy-dark/5"
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
        <div className="text-center py-20 bg-white border border-navy-dark/10 rounded-2xl px-4">
          <AlertCircle className="w-12 h-12 text-navy-dark/15 mx-auto mb-4" />
          <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wider">
            No Media Found
          </h3>
          <p className="text-xs text-navy-dark/50 max-w-xs mx-auto mt-1.5 leading-relaxed font-sans">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-2">
              Media Type *
            </label>
            <div className="flex bg-gray-light p-1 rounded-xl w-full">
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
                        : 'text-navy-dark/60 hover:text-navy-dark'
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
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Traditional Dance - Aura 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors"
            />
          </div>

          {/* Category drop down */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white cursor-pointer"
            >
              <option>Events</option>
              <option>Competitions</option>
              <option>Campus Life</option>
              <option>General</option>
            </select>
          </div>

          {/* Upgraded MediaPreviewBox linked to Type */}
          <MediaPreviewBox
            required
            mediaType={formData.media_type}
            value={formData.media_url}
            onChange={(val) => setFormData({ ...formData, media_url: val })}
          />

          {/* Action buttons */}
          <div className="flex space-x-3 pt-3 border-t border-navy-dark/10">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 border border-navy-dark/15 hover:bg-navy-dark/5 text-navy-dark font-display text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Media...</span>
                </>
              ) : (
                <span>Publish Media</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminGallery;
