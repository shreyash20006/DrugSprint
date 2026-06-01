import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  Play,
  Video,
  Music,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCloudinaryThumbnail, getCloudinaryMediaUrl } from '../lib/cloudinary';

interface GalleryItem {
  id: string;
  category: 'Events' | 'Competitions' | 'Campus Life' | 'General';
  title: string;
  media_url: string;
  media_urls?: string[];
  media_type: 'image' | 'video' | 'audio';
  created_at: string;
}

/* ========================================================
 * CUSTOM FULLY-SKINNED AUDIO PLAYER COMPONENT
 * ======================================================== */
const CustomAudioPlayer: React.FC<{ audioItem: GalleryItem }> = ({ audioItem }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-shadow hover:shadow-md animate-in fade-in duration-300">
      <audio
        ref={audioRef}
        src={getCloudinaryMediaUrl(audioItem.media_url, 'audio')}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Left: Monogram + Titles info */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
          <Music className={`w-6 h-6 ${isPlaying ? 'animate-bounce' : 'animate-pulse'}`} />
        </div>
        <div>
          <span className="text-orange-burnt text-[9px] font-bold uppercase tracking-widest block leading-none mb-1">
            🎵 Audio • {audioItem.category}
          </span>
          <h4 className="font-display font-extrabold text-sm sm:text-base text-navy-dark leading-snug">
            {audioItem.title}
          </h4>
        </div>
      </div>

      {/* Middle: Progress timeline bar */}
      <div className="flex-grow flex items-center space-x-3 w-full md:max-w-md">
        <span className="text-[10px] text-navy-dark/50 font-sans font-bold select-none shrink-0 tabular-nums">
          {formatTime(currentTime)}
        </span>
        
        {/* seek progress bar */}
        <div 
          onClick={handleProgressBarClick}
          className="relative flex-grow h-2 bg-navy-dark/10 rounded-full cursor-pointer overflow-hidden group/seek"
        >
          <div 
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-orange-burnt rounded-full transition-all duration-100 ease-out"
          />
        </div>

        <span className="text-[10px] text-navy-dark/50 font-sans font-bold select-none shrink-0 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* Right: Action controllers (⏮ ⏯ ⏭ 🔊) */}
      <div className="flex items-center justify-between md:justify-end space-x-4 shrink-0 border-t md:border-t-0 border-navy-dark/5 pt-3 md:pt-0">
        <div className="flex items-center space-x-2">
          {/* Skip backward */}
          <button 
            onClick={() => { if(audioRef.current) audioRef.current.currentTime = 0; }} 
            className="p-2 rounded-lg text-navy-dark/65 hover:bg-navy-dark/5 hover:text-navy-dark transition-colors outline-none"
            title="Restart Track"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Play/Pause */}
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-orange-burnt text-white flex items-center justify-center shadow hover:bg-orange-burnt/95 hover:scale-105 active:scale-95 transition-all outline-none"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="text-sm font-sans font-extrabold select-none">⏸</span>
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
          
          {/* Skip forward */}
          <button 
            onClick={() => { if(audioRef.current) audioRef.current.currentTime = duration; }} 
            className="p-2 rounded-lg text-navy-dark/65 hover:bg-navy-dark/5 hover:text-navy-dark transition-colors outline-none"
            title="Skip Track"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Volume bar toggle */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="p-2 rounded-lg text-navy-dark/65 hover:bg-navy-dark/5 hover:text-navy-dark transition-colors outline-none"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <span className="text-xs font-sans font-bold select-none leading-none">🔇</span>
            ) : (
              <span className="text-xs font-sans font-bold select-none leading-none">🔊</span>
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 accent-orange-burnt cursor-pointer h-1 rounded-lg bg-navy-dark/10"
          />
        </div>
      </div>
    </div>
  );
};

const LazyGalleryImage: React.FC<{ src: string; alt: string; className: string }> = ({ src, alt, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      {isVisible ? (
        <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
      ) : (
        <div className="w-full h-full bg-navy-dark/5" />
      )}
    </div>
  );
};

export const GalleryGrid: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Images' | 'Videos' | 'Audio' | 'Events'>('All');
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

  // Sync category and type selectors
  useEffect(() => {
    let result = [...photos];

    if (activeFilter === 'Images') {
      result = result.filter((p) => p.media_type === 'image');
    } else if (activeFilter === 'Videos') {
      result = result.filter((p) => p.media_type === 'video');
    } else if (activeFilter === 'Audio') {
      result = result.filter((p) => p.media_type === 'audio');
    } else if (activeFilter === 'Events') {
      result = result.filter((p) => p.category.toLowerCase() === 'events');
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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20 uppercase tracking-widest leading-none select-none">
            <Video className="w-2.5 h-2.5 shrink-0" />
            <span>Video</span>
          </span>
        );
      case 'audio':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-blue-500/10 text-blue-600 border-blue-500/20 uppercase tracking-widest leading-none select-none">
            <Music className="w-2.5 h-2.5 shrink-0" />
            <span>Audio</span>
          </span>
        );
      case 'image':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-gray-100 text-gray-500 border-gray-200 uppercase tracking-widest leading-none select-none">
            <ImageIcon className="w-2.5 h-2.5 shrink-0" />
            <span>Image</span>
          </span>
        );
    }
  };

  // Flickering skeleton loaders grid
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy-dark/5 animate-pulse">
          <div className="h-56 bg-navy-dark/5" />
          <div className="p-5 space-y-3">
            <div className="h-3.5 bg-navy-dark/5 rounded w-1/4" />
            <div className="h-5 bg-navy-dark/5 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  // Group items by type so list and masonry grids are combined beautifully on 'All' tab
  const showAudioOnly = activeFilter === 'Audio';
  const showGridOnly = activeFilter === 'Images' || activeFilter === 'Videos';

  const gridItems = filteredItems.filter((p) => p.media_type !== 'audio');
  const audioItems = filteredItems.filter((p) => p.media_type === 'audio');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* 1. SELECTION FILTER STRIP */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {(['All', 'Images', 'Videos', 'Audio', 'Events'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-full font-display text-xs sm:text-sm font-semibold transition-all duration-300 outline-none select-none ${
                isActive
                  ? 'bg-orange-burnt text-white shadow-lg shadow-orange-burnt/25 scale-105'
                  : 'bg-white hover:bg-navy-dark hover:text-white text-navy-dark/70 border border-navy-dark/5 shadow-xs'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* 2. GRID / LIST PRESENTATIONS */}
      {isLoading ? (
        <SkeletonGrid />
      ) : filteredItems.length > 0 ? (
        <div className="space-y-10">
          
          {/* Card Grids for Images and Videos (Visible if active filter is not Audio only) */}
          {!showAudioOnly && gridItems.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {gridItems.map((item, index) => {
                  const thumbnail = getCloudinaryThumbnail(item.media_url, item.media_type);

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -5 }}
                      onClick={() => setLightboxIndex(index)}
                      className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md cursor-pointer border border-navy-dark/5 group transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Image cover / Video poster */}
                      <div className="relative h-56 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                        {item.media_type === 'video' ? (
                          <video
                            src={item.media_url}
                            poster={thumbnail.endsWith('.jpg') ? thumbnail : undefined}
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
                          <LazyGalleryImage
                            src={thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-350"
                          />
                        )}

                        {/* Multi-Photo Album Badge */}
                        {item.media_type === 'image' && item.media_urls && item.media_urls.length > 1 && (
                          <div className="absolute top-3 right-3 bg-[#050B18]/70 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/10 text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1 shadow-sm select-none z-10">
                            <span className="text-orange-burnt font-sans text-xs">📸</span>
                            <span>{item.media_urls.length} Photos</span>
                          </div>
                        )}

                        {/* Video Play Circle Overlay */}
                        {item.media_type === 'video' && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-orange-burnt text-white flex items-center justify-center shadow-lg transform group-hover:scale-108 transition-all">
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                        
                        {/* Hover camera tag */}
                        <div className="absolute bottom-3 right-3 bg-black/40 p-2 rounded-full backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-orange-burnt text-[9px] font-extrabold uppercase tracking-widest block leading-none select-none">
                            {item.category}
                          </span>
                          {getMediaTypeBadge(item.media_type)}
                        </div>
                        <h3 className="font-display font-extrabold text-base text-navy-dark leading-snug">
                          {item.title}
                        </h3>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* List Layout for Audio Files (Visible if active filter is not Grid only) */}
          {!showGridOnly && audioItems.length > 0 && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Optional Section Header */}
              {activeFilter === 'All' && (
                <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wider border-b border-navy-dark/5 pb-2">
                  🎙️ Campus Audios & Lectures
                </h3>
              )}
              
              <div className="space-y-4">
                {audioItems.map((audio) => (
                  <CustomAudioPlayer key={audio.id} audioItem={audio} />
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white border border-navy-dark/10 rounded-2xl px-6 max-w-xl mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-navy-dark/15 mx-auto mb-4" />
          <h3 className="font-display font-extrabold text-base text-navy-dark uppercase tracking-wider">
            📸 Photos coming soon!
          </h3>
          <p className="text-xs text-navy-dark/50 max-w-xs mx-auto mt-1.5 leading-relaxed font-sans">
            The Student Council has not uploaded any visual memories to this category yet. Check back soon for snapshots of sports fests, cultural nights, and campus life!
          </p>
        </div>
      )}

      {/* 3. LIGHTBOX DRAWER OVERLAY (Visible on Image / Video clicks) */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-between p-4 sm:p-8 backdrop-blur-md"
          >
            {/* Header Controls */}
            <div className="flex items-center justify-between text-white w-full max-w-7xl mx-auto z-10 pt-2">
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold tracking-wider bg-white/10 px-4 py-1.5 rounded-full uppercase select-none">
                <ImageIcon className="w-4 h-4 text-orange-burnt" />
                <span>
                  {filteredItems[lightboxIndex].category} ({lightboxIndex + 1}/{filteredItems.length})
                </span>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-orange-burnt flex items-center justify-center transition-colors text-white outline-none"
                aria-label="Close Lightbox"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Central Media Slide */}
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto flex-grow my-4 relative">
              {/* Prev Button (Hide if media type is audio as they are in list layout) */}
              <button
                onClick={handlePrev}
                className="absolute left-0 sm:left-4 z-10 w-12 h-12 rounded-full bg-white/5 hover:bg-orange-burnt text-white flex items-center justify-center transition-colors shrink-0 backdrop-blur-xs"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Central container */}
              <motion.div
                key={filteredItems[lightboxIndex].id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl aspect-[4/3] rounded-2xl mx-auto bg-gray-900/50 flex items-center justify-center relative shadow-2xl overflow-hidden border border-white/5"
              >
                {/* Dynamic Player inside Lightbox */}
                {filteredItems[lightboxIndex].media_type === 'video' ? (
                  <video
                    src={getCloudinaryMediaUrl(filteredItems[lightboxIndex].media_url, 'video')}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                ) : filteredItems[lightboxIndex].media_urls && filteredItems[lightboxIndex].media_urls.length > 1 ? (
                  /* Slide-based Image Carousel */
                  <div className="w-full h-full flex items-center justify-center relative bg-black">
                    {/* Inner Prev arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev === 0 ? filteredItems[lightboxIndex].media_urls!.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-orange-burnt text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer backdrop-blur-xs border border-white/10"
                      aria-label="Previous Photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Image frame */}
                    <div className="w-full h-full flex items-center justify-center p-6 select-none">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={activePhotoIndex}
                          src={getCloudinaryMediaUrl(filteredItems[lightboxIndex].media_urls[activePhotoIndex], 'image')}
                          alt={`${filteredItems[lightboxIndex].title} - Photo ${activePhotoIndex + 1}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </AnimatePresence>
                    </div>

                    {/* Inner Next arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev === filteredItems[lightboxIndex].media_urls!.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-orange-burnt text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer backdrop-blur-xs border border-white/10"
                      aria-label="Next Photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Carousel bullet navigator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md z-20 border border-white/10">
                      {filteredItems[lightboxIndex].media_urls.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIndex(dotIdx);
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            activePhotoIndex === dotIdx 
                              ? 'bg-orange-burnt w-3' 
                              : 'bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Photo ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <img
                    src={getCloudinaryMediaUrl(filteredItems[lightboxIndex].media_url, 'image')}
                    alt={filteredItems[lightboxIndex].title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </motion.div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="absolute right-0 sm:right-4 z-10 w-12 h-12 rounded-full bg-white/5 hover:bg-orange-burnt text-white flex items-center justify-center transition-colors shrink-0 backdrop-blur-xs"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Footer details */}
            <div className="text-center text-white max-w-3xl mx-auto w-full pb-4">
              <h4 className="font-display font-extrabold text-base sm:text-xl mb-1 text-orange-burnt uppercase tracking-wide">
                {filteredItems[lightboxIndex].title}
              </h4>
              {filteredItems[lightboxIndex].media_type === 'image' && 
               filteredItems[lightboxIndex].media_urls && 
               filteredItems[lightboxIndex].media_urls.length > 1 && (
                <p className="text-xs text-white/55 font-semibold font-sans tracking-wide mt-1 select-none">
                  Viewing Image {activePhotoIndex + 1} of {filteredItems[lightboxIndex].media_urls.length}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryGrid;
