import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const FloatingScrollButtons: React.FC = () => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      
      // Ignore if hovering over the scroll buttons themselves
      if (target?.closest('#floating-scroll-buttons')) return;
      
      let scrollableTarget = null;
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const isScrollableY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && target.scrollHeight > target.clientHeight;
        const isScrollableX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && target.scrollWidth > target.clientWidth;
        
        if (isScrollableY || isScrollableX) {
          scrollableTarget = target;
          break;
        }
        target = target.parentElement;
      }
      
      setHoveredElement(scrollableTarget || document.documentElement);
    };

    // Use passive listener for performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scroll = (direction: 'up' | 'down') => {
    // Determine the scroll target
    let target = hoveredElement;
    if (!target) target = document.documentElement;
    
    const amount = 350; // pixels to scroll per click
    
    // Fallback for Admin Portal since it uses a <main> container instead of the document body
    if (target === document.documentElement || target === document.body) {
      const adminMain = document.getElementById('admin-main-scroll');
      if (adminMain && adminMain.scrollHeight > adminMain.clientHeight) {
        target = adminMain;
      }
    }
    
    if (target === document.documentElement || target === document.body) {
      window.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
    } else {
      const style = window.getComputedStyle(target);
      const isScrollableY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && Math.ceil(target.scrollHeight) > target.clientHeight;
      const isScrollableX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && Math.ceil(target.scrollWidth) > target.clientWidth;
      
      if (isScrollableY) {
        target.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
      } else if (isScrollableX) {
        target.scrollBy({ left: direction === 'up' ? -amount : amount, behavior: 'smooth' });
      } else {
        // Ultimate fallback if strict checks fail but we know it's a target
        target.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div id="floating-scroll-buttons" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      <button 
        onClick={() => scroll('up')}
        className="w-12 h-12 bg-orange-burnt hover:bg-[#b04a18] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(214,90,30,0.5)] backdrop-blur-md transition-all active:scale-90"
        title="Scroll Up"
      >
        <ChevronUp className="w-7 h-7 ml-0.5 mt-0.5" />
      </button>
      <button 
        onClick={() => scroll('down')}
        className="w-12 h-12 bg-orange-burnt hover:bg-[#b04a18] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(214,90,30,0.5)] backdrop-blur-md transition-all active:scale-90"
        title="Scroll Down"
      >
        <ChevronDown className="w-7 h-7 ml-0.5 mb-0.5" />
      </button>
    </div>
  );
};
