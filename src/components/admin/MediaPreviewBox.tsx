import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, 
  Video, 
  Music, 
  AlertTriangle, 
  Link as LinkIcon, 
  Loader2 
} from 'lucide-react';
import { getCloudinaryMediaUrl } from '../../lib/cloudinary';

interface MediaPreviewBoxProps {
  mediaType: 'image' | 'video' | 'audio';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const MediaPreviewBox: React.FC<MediaPreviewBoxProps> = ({
  mediaType,
  value,
  onChange,
  required = false,
}) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLoadError(false);
    if (!value.trim()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
  }, [value, mediaType]);

  const handleLoadSuccess = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleLoadError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const activeMediaUrl = getCloudinaryMediaUrl(value, mediaType);

  const getMediaIcon = (type: typeof mediaType) => {
    switch (type) {
      case 'video':
        return <Video className="w-12 h-12 text-navy-dark/25" />;
      case 'audio':
        return <Music className="w-12 h-12 text-navy-dark/25" />;
      case 'image':
      default:
        return <ImageIcon className="w-12 h-12 text-navy-dark/25" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Direct Media Destination URL input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5 flex items-center space-x-1">
          <LinkIcon className="w-3 h-3 text-orange-burnt" />
          <span>Cloudinary or Direct Media URL {required && '*'}</span>
        </label>
        <input
          type="url"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Paste direct ${mediaType} URL address here...`}
          className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors"
        />
        <p className="text-[10px] text-navy-dark/45 mt-1 font-sans">
          Upload media to Cloudinary, copy the direct address link (e.g. .jpg, .mp4, .mp3, etc.), and paste here.
        </p>
      </div>

      {/* 2. Visual Preview Sandbox Container */}
      <div className="border border-dashed border-navy-dark/15 bg-navy-dark/[0.015] rounded-xl min-h-56 flex flex-col items-center justify-center overflow-hidden relative p-4">
        
        {/* Loading overlay spinner */}
        {isLoading && value.trim() && (
          <div className="absolute inset-0 z-10 bg-white/85 flex flex-col items-center justify-center text-navy-dark/60">
            <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-display">
              Resolving Media Stream...
            </span>
          </div>
        )}

        {/* Dynamic Rendering Preview based on selected media type */}
        {value.trim() && !loadError ? (
          <div className="w-full flex flex-col items-center justify-center space-y-4">
            
            {/* Image Previewer */}
            {mediaType === 'image' && (
              <img
                src={activeMediaUrl}
                alt="Image preview"
                onLoad={handleLoadSuccess}
                onError={handleLoadError}
                className="w-full max-h-48 object-contain rounded-lg shadow-sm"
              />
            )}

            {/* Video Previewer */}
            {mediaType === 'video' && (
              <video
                src={activeMediaUrl}
                controls
                onLoadedData={handleLoadSuccess}
                onError={handleLoadError}
                className="w-full max-h-48 rounded-lg shadow-sm bg-black object-contain"
              />
            )}

            {/* Audio Previewer */}
            {mediaType === 'audio' && (
              <div className="w-full space-y-4 flex flex-col items-center">
                {/* Visual Audio Waveform Monogram */}
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner">
                  <Music className="w-8 h-8 animate-pulse" />
                </div>
                <audio
                  src={activeMediaUrl}
                  controls
                  onCanPlay={handleLoadSuccess}
                  onError={handleLoadError}
                  className="w-full max-w-sm"
                />
              </div>
            )}

          </div>
        ) : value.trim() && loadError ? (
          /* Error feedback panel */
          <div className="flex flex-col items-center justify-center text-red-500 text-center space-y-2 p-4">
            <AlertTriangle className="w-10 h-10 animate-bounce" />
            <h4 className="font-display font-bold text-xs uppercase tracking-wider">
              Failed to load {mediaType}
            </h4>
            <p className="text-[10px] text-red-500/70 max-w-xs leading-relaxed font-sans">
              Could not resolve direct media link. Make sure the pasted URL is valid and publicly accessible.
            </p>
          </div>
        ) : (
          /* Empty placeholder card */
          <div className="flex flex-col items-center justify-center text-navy-dark/25 text-center space-y-2 p-4">
            {getMediaIcon(mediaType)}
            <h4 className="font-display font-bold text-xs uppercase tracking-widest">
              Live {mediaType} Preview
            </h4>
            <p className="text-[10px] text-navy-dark/45 max-w-xs leading-relaxed font-sans">
              Provide a valid link above to render a live, dynamic stream of your published portfolio media.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default MediaPreviewBox;
