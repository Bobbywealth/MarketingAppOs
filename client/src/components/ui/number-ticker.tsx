import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  prefix = '',
  suffix = '',
  decimalPlaces = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        motionValue.set(value);
      }, delay * 1000);
    }
  }, [motionValue, isInView, delay, value]);

  useEffect(() => {
    springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toLocaleString('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={className}
    >
      {prefix}{direction === 'down' ? value : 0}{suffix}
    </span>
  );
}

