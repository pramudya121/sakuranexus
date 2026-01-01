import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | '16/9' | '4/3' | 'auto';
  blur?: boolean;
}

const LazyImage = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  aspectRatio = 'square',
  blur = true,
  className,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const aspectClasses = {
    square: 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    auto: '',
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-secondary/30',
        aspectClasses[aspectRatio],
        className
      )}
    >
      {!isLoaded && !isError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {isInView && (
        <img
          src={isError ? fallback : src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsError(true);
            setIsLoaded(true);
          }}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            blur && !isLoaded && 'blur-sm scale-105',
            isLoaded && 'blur-0 scale-100',
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100'
          )}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
