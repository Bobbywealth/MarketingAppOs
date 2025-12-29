import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const pullThreshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;
      if (diff > 0) {
        // Apply resistance
        const distance = Math.min(diff * 0.4, pullThreshold + 20);
        setPullDistance(distance);
        
        // Prevent default only if pulling down at top
        if (diff > 10 && e.cancelable) {
          // e.preventDefault(); // This can sometimes break scrolling if not careful
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= pullThreshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(40); // Keep indicator visible while refreshing
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200 pointer-events-none"
        style={{ height: pullDistance, opacity: pullDistance / pullThreshold }}
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: (pullDistance / pullThreshold) * 180 }}
          transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring", stiffness: 300, damping: 30 }}
        >
          <RefreshCw 
            className={`w-6 h-6 ${
              pullDistance >= pullThreshold ? 'text-primary' : 'text-muted-foreground'
            }`} 
          />
        </motion.div>
      </div>
      <motion.div
        animate={{ y: pullDistance > 0 ? pullDistance : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

