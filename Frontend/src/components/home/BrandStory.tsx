import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Award, Globe, Sparkles, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const stats = [
  { icon: Award, value: 2, suffix: '+', label: 'Years in Pakistan', delay: '0s' },
  { icon: Sparkles, value: 5, suffix: '+', label: 'Signature Perfume', delay: '0.2s' },
  { icon: Globe, value: 15, suffix: '+', label: 'Cities Across Pakistan', delay: '0.4s' },
  { icon: Users, value: 6000, suffix: '+', label: 'Happy Customers', delay: '0.6s' },
];

const StatNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            const duration = 1500;
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

    return () => {
      observer.disconnect();
    };
  }, [value, hasAnimated]);

  const formatted = value >= 1000 ? `${(displayValue / 1000).toFixed(displayValue === value ? 1 : 1)}K` : displayValue;

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
};

const BrandStory = () => {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-secondary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-24 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 animate-slide-in-left">
            <p className="font-accent text-primary tracking-[0.3em] uppercase mb-3 md:mb-4 text-xs md:text-sm">Our Heritage</p>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl mb-4 md:mb-6 leading-tight">
              The Art of
              <br />
              <span className="text-primary relative inline-block">
                Sensus Perfume
                <span className="absolute bottom-0 left-0 w-full h-1 bg-primary/50">
                  <span className="absolute inset-0 animate-shimmer" />
                </span>
              </span>
            </h2>
            <div className="w-12 md:w-16 h-px bg-primary mb-6 md:mb-8" />
            <p className="text-muted-foreground leading-relaxed mb-4 md:mb-6 text-sm md:text-base lg:text-lg">
              Founded on the principles of exceptional craftsmanship and unwavering quality, 
              Sensus Perfume has been creating extraordinary fragrances for the modern individual. 
              Each perfume is a masterpiece, meticulously composed using the world's finest ingredients.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
              Our master perfumers blend tradition with innovation, creating scents that transcend
              time and leave an indelible mark on all who experience them. Every bottle tells a 
              story of passion, artistry, and the relentless pursuit of perfection.
            </p>
            <Button variant="outline" size="lg" asChild className="hover-lift group">
              <Link to="/about">
                Discover Our Story
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="order-1 lg:order-2 relative">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="group hover-lift animate-slide-up"
                    style={{ 
                      animationDelay: stat.delay
                    }}
                  >
                    <div className="bg-background border border-border hover:border-primary p-4 md:p-6 lg:p-8 text-center transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-center">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Icon */}
                      <div className="relative mb-3 md:mb-4 flex justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                          <Icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-primary" />
                        </div>
                      </div>
                      
                      {/* Value */}
                      <span className="relative font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-primary block mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                        <StatNumber value={stat.value} suffix={stat.suffix} />
                      </span>
                      
                      {/* Label */}
                      <p className="relative text-sm text-muted-foreground leading-tight">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
