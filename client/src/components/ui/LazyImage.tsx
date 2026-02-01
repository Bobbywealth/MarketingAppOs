import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
}

/**
 * LazyImage component for optimized image loading with:
 * - Lazy loading using Intersection Observer
 * - Loading placeholder with skeleton animation
 * - Error handling with fallback
 * - Smooth fade-in transition
 * - Aspect ratio preservation to prevent layout shift
 */
export function LazyImage({
  src,
  alt,
  className,
  fallback,
  aspectRatio,
  loading = "lazy",
  decoding = "async",
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Aspect ratio styles
  const aspectRatioStyles = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before element comes into view
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isInView || isLoaded || isError) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoaded(true);
    };

    img.onerror = () => {
      setIsError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isInView, isLoaded, isError]);

  if (isError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden bg-muted flex items-center justify-center",
          aspectRatio ? aspectRatioStyles[aspectRatio] : "",
          className
        )}
      >
        {fallback || (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-4">
            <svg
              className="w-8 h-8 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Image failed to load</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatio ? aspectRatioStyles[aspectRatio] : "",
        className
      )}
    >
      {/* Skeleton loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted/50">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/0 via-muted/20 to-muted/0 animate-shimmer" />
        </div>
      )}

      {/* Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Avatar component with lazy loading for user images
 */
interface AvatarProps extends Omit<LazyImageProps, "aspectRatio"> {
  size?: "sm" | "md" | "lg" | "xl";
  fallbackText?: string;
}

export function Avatar({
  src,
  alt,
  size = "md",
  fallbackText,
  className,
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initials = fallbackText
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center font-medium",
        sizeClasses[size],
        className
      )}
    >
      <LazyImage
        src={src}
        alt={alt}
        className="w-full h-full"
        {...props}
      />
      {!src && (
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {initials || "?"}
        </span>
      )}
    </div>
  );
}

export default LazyImage;
