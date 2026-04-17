import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import HeroSection from '@/components/home/HeroSection';
import CategorySection from '@/components/home/CategorySection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BrandStory from '@/components/home/BrandStory';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { newsletterAPI } from '@/lib/api';
import { toast } from 'sonner';

const Index = () => {
  const showCategorySection = false;
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Add scroll reveal effect
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const result = await newsletterAPI.subscribe(email);
      toast.success(result.message || 'Thank you for subscribing!');
      setEmail('');
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast.error('Unable to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header />
      <CartDrawer />
      <ScrollToTop />
      
      <main>
        <HeroSection />
        {showCategorySection && <CategorySection />}
        <FeaturedProducts />
        <BrandStory />
        
        {/* Enhanced Newsletter Section */}
        <section className="py-16 md:py-20 bg-background relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              
              <p className="font-accent text-primary tracking-[0.3em] uppercase mb-4 animate-slide-in-left">Stay Connected</p>
              <h2 className="font-display text-3xl md:text-4xl mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Join Our World
              </h2>
              <div className="w-16 h-px bg-primary mx-auto mb-6 animate-scale-in" style={{ animationDelay: '0.4s' }} />
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
                Subscribe to receive exclusive offers, early access to new releases, and the latest from Sensus Perfume.
              </p>
              
              <form 
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto animate-scale-in" 
                style={{ animationDelay: '0.8s' }}
              >
                <div className="flex-1 relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-secondary border-2 border-border px-6 py-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300 group-hover:border-primary/50"
                  />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground px-8 py-4 text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-all duration-300 whitespace-nowrap relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
                >
                  <span className="relative z-10">
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </button>
              </form>
              
              <p className="text-xs text-muted-foreground mt-6">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
