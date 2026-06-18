import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, X, ChevronLeft, ChevronRight, 
  Image as ImageIcon, Play, Video, Music, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCloudinaryThumbnail, getCloudinaryMediaUrl } from '../../lib/cloudinary';

interface GalleryItem {
  id: string;
  category: 'Events' | 'Competitions' | 'Campus Life' | 'General';
  title: string;
  media_url: string;
  media_urls?: string[];
  media_type: 'image' | 'video' | 'audio';
  created_at: string;
}

const CustomAudioPlayer: React.FC<{ audioItem: GalleryItem }> = ({ audioItem }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    audioRef.current.currentTime = clickPercent * duration;
    setCurrentTime(clickPercent * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-[#0F1E42]/80 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-3 shadow-md">
      <audio
        ref={audioRef}
        src={getCloudinaryMediaUrl(audioItem.media_url, 'audio')}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <button 
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-orange-burnt text-white flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform"
        >
          {isPlaying ? (
            <span className="text-xs font-bold font-sans">⏸</span>
          ) : (
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <span className="text-orange-burnt text-[8px] font-bold uppercase tracking-widest block leading-none mb-1">
            {audioItem.category}
          </span>
          <h4 className="font-display font-bold text-xs text-white truncate">
            {audioItem.title}
          </h4>
          <div className="flex items-center space-x-2 mt-1.5">
            <span className="text-[9px] text-white/40 font-mono select-none">
              {formatTime(currentTime)}
            </span>
            <div 
              onClick={handleProgressBarClick}
              className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden"
            >
              <div 
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-orange-burnt rounded-full"
              />
            </div>
            <span className="text-[9px] text-white/40 font-mono select-none">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Images' | 'Videos' | 'Audio'>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [lightboxIndex]);

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
      console.error('Error fetching visual portfolio feed:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    let result = [...photos];
    if (activeFilter === 'Images') {
      result = result.filter((p) => p.media_type === 'image');
    } else if (activeFilter === 'Videos') {
      result = result.filter((p) => p.media_type === 'video');
    } else if (activeFilter === 'Audio') {
      result = result.filter((p) => p.media_type === 'audio');
    }
    setFilteredItems(result);
  }, [photos, activeFilter]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    const prevIdx = lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1;
    setLightboxIndex(prevIdx);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    const nextIdx = lightboxIndex === filteredItems.length - 1 ? 0 : lightboxIndex + 1;
    setLightboxIndex(nextIdx);
  };

  const getMediaTypeBadge = (type: 'image' | 'video' | 'audio') => {
    switch (type) {
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20 uppercase tracking-widest leading-none select-none">
            <Video className="w-2 h-2" />
            <span>Video</span>
          </span>
        );
      case 'audio':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest leading-none select-none">
            <Music className="w-2 h-2" />
            <span>Audio</span>
          </span>
        );
      case 'image':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold bg-white/5 text-white/50 border-white/10 uppercase tracking-widest leading-none select-none">
            <ImageIcon className="w-2 h-2" />
            <span>Image</span>
          </span>
        );
    }
  };

  const gridItems = filteredItems.filter((p) => p.media_type !== 'audio');
  const audioItems = filteredItems.filter((p) => p.media_type === 'audio');

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Campus Gallery
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Visual Memories
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Glimpses of exhibitions, cultural fests, sports weeks, and college life at TGPCOP Nagpur.
        </p>
      </section>

      {/* Categories chips horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {(['All', 'Images', 'Videos', 'Audio'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full font-display text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                isActive
                  ? 'bg-orange-burnt text-white'
                  : 'bg-[#0F1E42]/80 text-white/60 border border-white/5'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0F1E42]/80 border border-white/10 rounded-2xl h-48 relative overflow-hidden animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-6">
          {/* Card Grids for Images and Videos */}
          {activeFilter !== 'Audio' && gridItems.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {gridItems.map((item, index) => {
                const thumbnail = getCloudinaryThumbnail(item.media_url, item.media_type);
                return (
                  <div
                    key={item.id}
                    onClick={() => setLightboxIndex(index)}
                    className="bg-[#0F1E42]/80 border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform"
                  >
                    <div className="relative h-28 bg-[#050B18] flex items-center justify-center overflow-hidden">
                      {item.media_type === 'video' ? (
                        <div className="w-full h-full relative">
                          <img src={thumbnail} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <Play className="w-5 h-5 fill-white text-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      )}

                      {item.media_urls && item.media_urls.length > 1 && (
                        <span className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                          📸 {item.media_urls.length}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-orange-burnt text-[8px] font-bold uppercase tracking-wider block">
                          {item.category}
                        </span>
                        {getMediaTypeBadge(item.media_type)}
                      </div>
                      <h4 className="font-display font-bold text-[10px] text-white/95 line-clamp-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List Layout for Audio Files */}
          {activeFilter !== 'Images' && activeFilter !== 'Videos' && audioItems.length > 0 && (
            <div className="space-y-3">
              {audioItems.map((audio) => (
                <CustomAudioPlayer key={audio.id} audioItem={audio} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No items found</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            The Student Council has not uploaded any visual memories to this category yet.
          </p>
        </div>
      )}

      {/* Lightbox drawer overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md"
          >
            <div className="flex items-center justify-between text-white w-full z-10 pt-2">
              <span className="text-[10px] font-bold tracking-wider bg-white/10 px-3 py-1 rounded-full uppercase">
                {filteredItems[lightboxIndex].category} ({lightboxIndex + 1}/{filteredItems.length})
              </span>
              <button onClick={() => setLightboxIndex(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between w-full flex-grow my-4 relative">
              <button onClick={handlePrev} className="absolute left-2 z-10 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg aspect-[4/3] rounded-xl bg-gray-900/50 flex items-center justify-center relative shadow-2xl overflow-hidden">
                {filteredItems[lightboxIndex].media_type === 'video' ? (
                  <video src={getCloudinaryMediaUrl(filteredItems[lightboxIndex].media_url, 'video')} controls autoPlay className="w-full h-full object-contain bg-black" />
                ) : filteredItems[lightboxIndex].media_urls && filteredItems[lightboxIndex].media_urls.length > 1 ? (
                  <div className="w-full h-full flex items-center justify-center relative bg-black">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev === 0 ? filteredItems[lightboxIndex].media_urls!.length - 1 : prev - 1));
                      }}
                      className="absolute left-2 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={getCloudinaryMediaUrl(filteredItems[lightboxIndex].media_urls[activePhotoIndex], 'image')}
                        alt="Carousel album slide"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev === filteredItems[lightboxIndex].media_urls!.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <img src={getCloudinaryMediaUrl(filteredItems[lightboxIndex].media_url, 'image')} alt={filteredItems[lightboxIndex].title} className="max-w-full max-h-full object-contain" />
                )}
              </div>

              <button onClick={handleNext} className="absolute right-2 z-10 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center text-white pb-4">
              <h4 className="font-display font-bold text-sm text-orange-burnt uppercase tracking-wide">
                {filteredItems[lightboxIndex].title}
              </h4>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
