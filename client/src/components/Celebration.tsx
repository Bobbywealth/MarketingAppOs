import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
  active: boolean;
  type?: 'confetti' | 'stars' | 'balloons';
  duration?: number;
}

export function Celebration({ active, type = 'confetti', duration = 3000 }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <>
            {[...Array(50)].map((_, i) => (
              <Particle key={i} index={i} type={type} />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Particle({ index, type }: { index: number; type: 'confetti' | 'stars' | 'balloons' }) {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 2;
  const randomDuration = 2 + Math.random() * 3;
  const randomRotation = Math.random() * 360;
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const color = colors[index % colors.length];

  const shapes = {
    confetti: (
      <div 
        className="w-3 h-3" 
        style={{ backgroundColor: color, transform: `rotate(${randomRotation}deg)` }} 
      />
    ),
    stars: (
      <span className="text-2xl" style={{ color }}>★</span>
    ),
    balloons: (
      <span className="text-3xl">🎈</span>
    )
  };

  return (
    <motion.div
      initial={{ y: -50, x: `${randomX}vw`, opacity: 1, rotate: 0 }}
      animate={{ 
        y: '110vh', 
        x: `${randomX + (Math.random() * 20 - 10)}vw`,
        rotate: 360 + randomRotation,
        opacity: [1, 1, 0]
      }}
      transition={{ 
        duration: randomDuration, 
        delay: randomDelay,
        ease: "linear"
      }}
      className="absolute"
    >
      {shapes[type]}
    </motion.div>
  );
}

