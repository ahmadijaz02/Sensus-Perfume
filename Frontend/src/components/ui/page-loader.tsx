import { useEffect, useState } from 'react';

type PageLoaderProps = {
  onFinish?: () => void;
  minimumMs?: number;
};

export const PageLoader = ({ onFinish, minimumMs = 1200 }: PageLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const startTime = performance.now();

    const finish = () => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(minimumMs - elapsed, 0);
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        onFinish?.();
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('load', finish);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center animate-fade-in">
      <div className="text-center">
        {/* Animated logo */}
        <div className="mb-8 animate-scale-in">
          <h1 className="font-display text-3xl tracking-[0.3em] text-foreground">
            SENSUS <span className="text-primary">PERFUME</span>
          </h1>
          <div className="w-32 h-px bg-primary mx-auto mt-4 animate-shimmer" />
        </div>

        {/* Loading animation */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        <p className="text-muted-foreground text-sm tracking-wider uppercase mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Crafting Excellence...
        </p>
      </div>
    </div>
  );
};
