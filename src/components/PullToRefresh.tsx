import { useState, useRef, useCallback, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const TRIGGER_THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
      e.preventDefault();
      // Apply resistance
      const resistance = 0.4;
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(adjustedDiff);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= TRIGGER_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50); // Keep a small indicator while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / TRIGGER_THRESHOLD, 1);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200 z-10"
        style={{ 
          top: `${pullDistance - 40}px`,
          opacity: progress,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center",
          isRefreshing && "animate-pulse"
        )}>
          <RefreshCw 
            className={cn(
              "w-5 h-5 text-primary transition-transform duration-200",
              isRefreshing && "animate-spin"
            )} 
            style={{ 
              transform: isRefreshing ? "rotate(0deg)" : `rotate(${progress * 360}deg)` 
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
