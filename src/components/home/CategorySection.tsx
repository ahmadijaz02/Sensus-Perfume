import { Link } from 'react-router-dom';
import { useState } from 'react';
import perfumeMen from '@/assets/perfume-men.jpg';
import perfumeWomen from '@/assets/perfume-women.jpg';
import perfumeUnisex from '@/assets/perfume-unisex.jpg';

const categories = [
  {
    name: 'For Him',
    description: 'Bold & Sophisticated',
    image: perfumeMen,
    path: '/shop/men',
  },
  {
    name: 'For Her',
    description: 'Elegant & Alluring',
    image: perfumeWomen,
    path: '/shop/women',
  },
  {
    name: 'Unisex',
    description: 'Timeless & Universal',
    image: perfumeUnisex,
    path: '/shop/unisex',
  },
];

const CategorySection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-20 bg-secondary relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16 scroll-reveal">
          <p className="font-accent text-primary tracking-[0.3em] uppercase mb-3 text-sm animate-slide-in-left">Collections</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>Shop by Category</h2>
          <div className="w-16 h-px bg-primary mx-auto animate-scale-in" style={{ animationDelay: '0.4s' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.path}
              className="group relative overflow-hidden aspect-[3/4] animate-slide-up rounded-sm"
              style={{ animationDelay: `${index * 0.15}s` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Background glow effect */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                hoveredIndex === index 
                  ? 'bg-gradient-radial from-primary/30 via-transparent to-transparent' 
                  : 'bg-gradient-radial from-primary/10 via-transparent to-transparent'
              }`} />
              
              {/* Image with enhanced clarity */}
              <img
                src={category.image}
                alt={category.name}
                className={`w-full h-full object-cover transition-all duration-1000 relative z-10 ${
                  hoveredIndex === index 
                    ? 'scale-110 brightness-140 contrast-120 saturate-130' 
                    : 'scale-100 brightness-115 contrast-105 saturate-120'
                }`}
              />
              
              {/* Base tint expanded to ensure text readability on dark images */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none z-20 bg-gradient-to-t from-background/80 via-background/50 to-transparent" />
              
              {/* Ambient glow from sides */}
              <div className={`absolute -inset-px bg-gradient-to-r from-primary/20 via-transparent to-primary/20 pointer-events-none transition-opacity duration-500 z-0 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`} />
              
              {/* Content */}
              <div className={`absolute bottom-0 left-0 right-0 p-8 transform transition-all duration-500 bg-gradient-to-t from-background/90 via-background/60 to-transparent z-30 ${
                hoveredIndex === index ? 'translate-y-[-16px]' : 'translate-y-0'
              }`}>
                <p className="font-accent text-sm text-foreground tracking-wider mb-2 transition-all duration-300 font-medium uppercase">
                  {category.description}
                </p>
                <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4 transition-all duration-300 font-semibold">
                  {category.name}
                </h3>
                <div className={`flex items-center text-sm tracking-[0.15em] uppercase transition-all duration-500 font-medium ${
                  hoveredIndex === index ? 'text-primary opacity-100' : 'text-foreground/70 opacity-70'
                }`}>
                  <span className="mr-2">Shop Now</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-500 ${hoveredIndex === index ? 'translate-x-2' : 'translate-x-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Decorative corner accent */}
              <div className={`absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/70 transition-all duration-500 ${
                hoveredIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
