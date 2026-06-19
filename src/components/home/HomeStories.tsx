import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HomeStory } from '../../hooks/useHomePageData';

interface HomeStoriesProps {
  stories: HomeStory[];
  isAdmin: boolean;
}

export const HomeStories: React.FC<HomeStoriesProps> = ({ stories, isAdmin }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (activeIndex === null) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (activeIndex < stories.length - 1) {
            setActiveIndex(activeIndex + 1);
          } else {
            setActiveIndex(null);
          }
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeIndex, stories.length]);

  if (stories.length === 0 && !isAdmin) return null;

  const goPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeIndex === null) return;
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
    else setProgress(0);
  };

  const goNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeIndex === null) return;
    if (activeIndex < stories.length - 1) setActiveIndex(activeIndex + 1);
    else setActiveIndex(null);
  };

  return (
    <>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-10">
        <div className="flex items-center gap-4 overflow-x-auto py-3 px-4 bg-[#0D1B3E]/60 backdrop-blur-md rounded-2xl border border-white/8 shadow-2xl no-scrollbar fade-x-mask">
          {isAdmin && (
            <Link
              to="/admin/stories"
              className="flex flex-col items-center shrink-0 gap-1.5 group"
              data-testid="add-story-link"
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/15 group-hover:border-orange-burnt flex items-center justify-center bg-white/[0.04] transition-all">
                <Plus className="w-5 h-5 text-white/50 group-hover:text-orange-burnt" strokeWidth={2.4} />
              </div>
              <span className="text-[10px] text-white/55 group-hover:text-orange-burnt font-sans font-bold tracking-wider">
                Add
              </span>
            </Link>
          )}

          {stories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => setActiveIndex(idx)}
              data-testid={`story-bubble-${idx}`}
              className="flex flex-col items-center shrink-0 gap-1.5 group outline-none cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-orange-burnt via-gold-accent to-orange-burnt group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full p-[1.5px] bg-[#050B18]">
                  <img
                    src={story.media_url}
                    alt={story.title || 'Story'}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] text-white/75 group-hover:text-orange-burnt font-sans font-bold max-w-[65px] truncate tracking-wide">
                {story.title || 'Campus'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen player */}
      {activeIndex !== null && stories[activeIndex] && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={() => setActiveIndex(null)}
          data-testid="story-player-overlay"
        >
          <div
            className="relative w-full max-w-md h-[90vh] sm:h-[80vh] bg-[#050B18] rounded-3xl overflow-hidden border border-white/10 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 inset-x-4 z-30 flex gap-1.5">
              {stories.map((_, idx) => (
                <div key={idx} className="h-1 bg-white/20 rounded-full overflow-hidden flex-1">
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{
                      width:
                        idx < activeIndex
                          ? '100%'
                          : idx === activeIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-8 inset-x-4 z-30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-orange-burnt to-gold-accent">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white font-display font-extrabold text-[10px]">
                    SC
                  </div>
                </div>
                <div>
                  <span className="font-display font-extrabold text-xs text-white block leading-none">
                    TGPCOP Council
                  </span>
                  <span className="text-[9px] text-white/55 font-sans font-semibold block mt-0.5">
                    {stories[activeIndex].created_at
                      ? new Date(stories[activeIndex].created_at!).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Campus'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveIndex(null)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/85 transition-all"
                data-testid="story-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-black relative flex items-center justify-center">
              <img
                src={stories[activeIndex].media_url}
                alt={stories[activeIndex].title || 'Story'}
                className="w-full max-h-full object-contain pointer-events-none"
              />

              <button
                type="button"
                onClick={goPrev}
                className="absolute left-0 top-0 w-1/3 h-full focus:outline-none flex items-center justify-start pl-2 group/prev"
                aria-label="Previous story"
              >
                <ChevronLeft className="w-6 h-6 text-white/0 group-hover/prev:text-white/60 transition-colors" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-0 top-0 w-2/3 h-full focus:outline-none flex items-center justify-end pr-2 group/next"
                aria-label="Next story"
              >
                <ChevronRight className="w-6 h-6 text-white/0 group-hover/next:text-white/60 transition-colors" />
              </button>
            </div>

            {stories[activeIndex].title && (
              <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-12 text-center pointer-events-none">
                <p className="text-white font-sans font-bold text-sm leading-relaxed drop-shadow-md">
                  {stories[activeIndex].title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HomeStories;
