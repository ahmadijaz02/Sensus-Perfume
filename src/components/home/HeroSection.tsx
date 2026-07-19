import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

const StatNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let observer: IntersectionObserver | null = null;

    const startObserver = () => {
      if (observer) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              setHasAnimated(true);

              const duration = 1200;
              const startTime = performance.now();

              const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(value * eased);
                setDisplayValue(current);

                if (progress < 1) {
                  requestAnimationFrame(animate);
                }
              };

              requestAnimationFrame(animate);
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(element);
    };

    const isPageReady = document.documentElement.dataset.pageReady === 'true';

    if (isPageReady) {
      startObserver();
    } else {
      const handleReady = () => startObserver();
      window.addEventListener('page-ready', handleReady, { once: true });
      return () => {
        window.removeEventListener('page-ready', handleReady);
        observer?.disconnect();
      };
    }

    return () => {
      observer?.disconnect();
    };
  }, [value, hasAnimated]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background pt-16 md:pt-20">
      <div className="container mx-auto px-4 pt-8 md:pt-12 lg:pt-16 pb-6 md:pb-8 lg:pb-10">
        <div className="max-w-4xl mx-auto text-center animate-slide-in-right">
            <p className="font-accent text-sm md:text-base text-primary tracking-[0.3em] uppercase mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              The Art of Perfumery
            </p>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Discover Your
              <br />
              <span className="text-primary relative inline-block">
                Signature Scent
                <span className="absolute bottom-0 left-0 w-full h-1 bg-primary/50">
                  <span className="absolute inset-0 animate-shimmer" />
                </span>
              </span>
            </h1>
            
            <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>
              Bold fragrances crafted for the modern individual, 
              designed to leave an unforgettable impression.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in" style={{ animationDelay: '0.8s' }}>
              <Button variant="hero" size="xl" asChild className="hover-lift group">
                <Link to="/shop">
                  Explore Collection
                  <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild className="hover-lift">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>

            {/* Stats aligned with Brand Story */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-border/50 animate-fade-in" style={{ animationDelay: '1s' }}>
              <div>
                <p className="font-display text-2xl md:text-3xl text-primary mb-1"><StatNumber value={2} suffix="+" /></p>
                <p className="text-xs text-muted-foreground">Years in Pakistan</p>
              </div>
              <div>
                <p className="font-display text-2xl md:text-3xl text-primary mb-1"><StatNumber value={5} suffix="+" /></p>
                <p className="text-xs text-muted-foreground">Signature Perfume</p>
              </div>
              <div>
                <p className="font-display text-2xl md:text-3xl text-primary mb-1"><StatNumber value={15} suffix="+" /></p>
                <p className="text-xs text-muted-foreground">Cities Across Pakistan</p>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-5 hidden md:flex justify-center animate-bounce" style={{ animationDelay: '1.1s' }}>
              <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase opacity-70 group-hover:opacity-100 transition-opacity">Scroll</span>
                <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
              </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
