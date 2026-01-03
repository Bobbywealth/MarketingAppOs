import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
}

export function InteractiveCard({ children, className }: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;

    const xPct = (mouseXPos / width) - 0.5;
    const yPct = (mouseYPos / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
    
    mouseX.set(mouseXPos);
    mouseY.set(mouseYPos);
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }

  const glowBackground = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.1) 0%, transparent 60%)`
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        "relative rounded-xl transition-all duration-200",
        isHovered ? "shadow-2xl z-10" : "shadow-md",
        className
      )}
    >
      <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
      
      {/* Dynamic Glow Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: glowBackground,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </motion.div>
  );
}

