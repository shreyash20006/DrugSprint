import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logAction } from '../../lib/logger';
import {
  Camera,
  Plus,
  Loader2,
  Trash2,
  X,
  Upload,
  Clock,
} from 'lucide-react';

interface Story {
  id: string;
  media_url: string;
  title?: string;
  created_at: string;
  expires_at: string;
}

export const AdminStories: React.FC = () => {
  const toast = useToast();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      // Fetch all stories (active or expired) so admin can see history, but order by expiry/creation
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err: any) {
      toast.error(`❌ Failed to load stories: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.warning('⚠️ File size exceeds 5MB limit.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return '';
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `story-${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      toast.error(`❌ File upload failed: ${err.message}`);
      return '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !mediaUrl) {
      toast.error('❌ Please select an image to upload.');
      return;
    }

    setIsSaving(true);
    try {
      let finalMediaUrl = mediaUrl;

      // Handle file upload if file is selected
      if (file) {
        const uploadedUrl = await handleUpload();
        if (!uploadedUrl) {
          setIsSaving(false);
          return;
        }
        finalMediaUrl = uploadedUrl;
      }

      // Calculate expires_at (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('stories').insert({
        media_url: finalMediaUrl,
        title: title.trim() || null,
        expires_at: expiresAt,
      });

      if (error) throw error;

      logAction('ADDED_STORY', `Uploaded story: ${title || 'No Title'} (${finalMediaUrl})`);
      toast.success('✅ Story uploaded successfully! Active for 24 hours.');
      
      setShowModal(false);
      setTitle('');
      setMediaUrl('');
      setFile(null);
      setPreviewUrl('');
      fetchStories();
    } catch (err: any) {
      toast.error(`❌ Failed to save story: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (story: Story) => {
    if (!window.confirm('Delete this story? It will immediately disappear from the homepage.')) return;

    try {
      // 1. Delete from storage if it belongs to branding bucket
      if (story.media_url.includes('/branding/')) {
        const filePath = story.media_url.split('/branding/').pop()?.split('?')[0];
        if (filePath) {
          await supabase.storage.from('branding').remove([filePath]);
        }
      }

      // 2. Delete from database
      const { error } = await supabase.from('stories').delete().eq('id', story.id);
      if (error) throw error;

      logAction('DELETED_STORY', `Deleted story: ${story.title || 'No Title'} (${story.media_url})`);
      toast.success('Story deleted.');
      fetchStories();
    } catch (err: any) {
      toast.error(`❌ Delete failed: ${err.message}`);
    }
  };

  const getHoursLeft = (expiryStr: string) => {
    const diff = new Date(expiryStr).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m left`;
  };

  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr).getTime() <= Date.now();
  };

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0D1B3E] text-white text-sm placeholder-white/35 outline-none focus:border-orange-burnt/50 transition-all';
  const labelCls =
    'block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <Camera className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Stories Manager</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">
              Upload Instagram-style stories that automatically disappear after 24 hours
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Story</span>
        </button>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
          <Camera className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/50 text-sm font-display font-bold">No stories uploaded yet</p>
          <p className="text-white/30 text-xs font-sans mt-1">Upload a story to display it on the student homepage</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {stories.map((story) => {
            const expired = isExpired(story.expires_at);
            return (
              <div
                key={story.id}
                className={`group relative bg-white/[0.03] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_8px_32px_rgba(5,11,24,0.4)] ${
                  expired
                    ? 'border-white/5 opacity-55 hover:opacity-85'
                    : 'border-orange-burnt/25 hover:border-orange-burnt/45'
                }`}
              >
                {/* Image */}
                <div className="h-44 relative overflow-hidden bg-black/45 border-b border-white/5">
                  <img
                    src={story.media_url}
                    alt={story.title || 'Story'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold border ${
                        expired
                          ? 'bg-red-500/10 text-red-400 border-red-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}
                    >
                      {expired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  </div>

                  {/* Expire Countdown */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 text-white text-[10px] font-sans">
                    <Clock className="w-3.5 h-3.5 text-orange-burnt" />
                    <span className="font-semibold">{getHoursLeft(story.expires_at)}</span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">
                      {story.title || 'Untitled Story'}
                    </p>
                    <p className="text-white/40 text-[9px] font-mono mt-0.5">
                      {new Date(story.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(story)}
                    className="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all shrink-0"
                    title="Delete Story"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
                <Camera className="w-4 h-4 text-orange-burnt" />
                <span>Upload Instagram Story</span>
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreviewUrl('');
                  setFile(null);
                }}
                className="p-1.5 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Image Select */}
              <div className="space-y-1.5">
                <label className={labelCls}>Story Image *</label>
                
                {previewUrl ? (
                  <div className="relative h-48 rounded-xl overflow-hidden border border-white/10 group bg-black/25">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl('');
                        setFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-orange-burnt/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.01]">
                    <Upload className="w-8 h-8 text-white/20 mb-2 group-hover:text-orange-burnt" />
                    <span className="text-white/60 text-xs font-semibold">Select Story Image</span>
                    <span className="text-white/30 text-[9px] font-sans mt-1">PNG, JPG up to 5MB (Vertical 9:16 recommended)</span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Title / Caption */}
              <div className="space-y-1.5">
                <label className={labelCls}>Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Admission Open 2026-27"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPreviewUrl('');
                    setFile(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs font-display font-bold uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading || (!file && !mediaUrl)}
                  className="flex-grow py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center space-x-1.5 border border-white/5"
                >
                  {(isSaving || isUploading) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Publish Story</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStories;
