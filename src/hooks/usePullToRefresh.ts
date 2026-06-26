import { useRef, useState, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  /** Minimum pull distance in px before triggering (default: 64) */
  threshold?: number;
  /** The scrollable container ref. If null, uses document scroll. */
  containerRef?: React.RefObject<HTMLElement | null>;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullProgress: number; // 0–1, for animating the indicator
}

/**
 * Touch-based pull-to-refresh for mobile screens.
 * Attach the returned values to a visual indicator component.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 64,
  containerRef,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const startY = useRef<number | null>(null);
  const isPulling = useRef(false);

  const getScrollTop = useCallback((): number => {
    if (containerRef?.current) return containerRef.current.scrollTop;
    return window.scrollY || document.documentElement.scrollTop;
  }, [containerRef]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      if (getScrollTop() === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [isRefreshing, getScrollTop]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || startY.current === null || isRefreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && getScrollTop() === 0) {
        // Dampen the pull (rubber-band feel)
        const progress = Math.min(delta / threshold, 1);
        setPullProgress(progress);
        if (delta > 8) {
          // Prevent page scroll while pulling
          try { e.preventDefault(); } catch { /* passive */ }
        }
      } else if (delta <= 0) {
        setPullProgress(0);
        isPulling.current = false;
        startY.current = null;
      }
    },
    [isRefreshing, threshold, getScrollTop]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || isRefreshing) {
      setPullProgress(0);
      startY.current = null;
      isPulling.current = false;
      return;
    }
    isPulling.current = false;
    startY.current = null;

    if (pullProgress >= 1) {
      setIsRefreshing(true);
      setPullProgress(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullProgress(0);
    }
  }, [isRefreshing, pullProgress, onRefresh]);

  useEffect(() => {
    const el = containerRef?.current ?? document;
    const opts: AddEventListenerOptions = { passive: false };

    el.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    el.addEventListener('touchmove', handleTouchMove as EventListener, opts);
    el.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart as EventListener);
      el.removeEventListener('touchmove', handleTouchMove as EventListener);
      el.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, containerRef]);

  return { isRefreshing, pullProgress };
}
