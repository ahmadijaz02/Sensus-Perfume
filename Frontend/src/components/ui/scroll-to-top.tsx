import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-24 md:right-8 z-40 w-11 h-11 md:w-12 md:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 animate-scale-in group hover:shadow-2xl"
          aria-label="Scroll to top">
          <ArrowUp size={18} className="md:w-5 md:h-5 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      )}
    </>
  );
};
